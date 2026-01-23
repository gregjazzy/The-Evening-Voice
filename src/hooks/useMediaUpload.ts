/**
 * Hook pour uploader des médias
 * 
 * ARCHITECTURE HYBRIDE :
 * - Images & Audio → Supabase Storage
 * - Vidéos → Cloudflare R2 (via API route)
 * 
 * Structure : {bucket}/{user_id}/{filename}
 */

'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'

// Types de médias supportés
export type MediaType = 'image' | 'audio' | 'video'

// Source du média (pour tracking)
export type MediaSource = 
  | 'upload'      // Uploadé par l'utilisateur
  | 'midjourney'  // Généré par fal.ai (images) - legacy name
  | 'elevenlabs'  // Généré par ElevenLabs
  | 'runway'      // Généré par fal.ai (vidéos) - legacy name
  | 'luma'        // Généré par Luma
  | 'gemini'      // Généré par Gemini
  | 'dalle'       // Généré par DALL-E

// Options d'upload
export interface UploadOptions {
  type: MediaType
  source?: MediaSource
  storyId?: string           // ID de l'histoire associée
  generateThumbnail?: boolean // Pour les vidéos
  maxSizeMB?: number          // Limite de taille
  quality?: number            // Compression image (0.1-1)
}

// Résultat de l'upload
export interface UploadResult {
  url: string                 // URL publique du fichier
  thumbnailUrl?: string       // URL de la miniature (vidéos)
  assetId: string             // ID dans la table assets
  fileName: string
  fileSize: number
  mimeType: string
}

// État du hook
interface UseMediaUploadReturn {
  upload: (file: File | Blob, options: UploadOptions) => Promise<UploadResult | null>
  uploadFromUrl: (url: string, options: UploadOptions) => Promise<UploadResult | null>
  deleteMedia: (assetId: string, type: MediaType) => Promise<boolean>
  isUploading: boolean
  progress: number
  error: string | null
}

// Mapping type → bucket (pour Supabase seulement)
const TYPE_TO_BUCKET: Record<'image' | 'audio', string> = {
  image: 'images',
  audio: 'audio',
}

// Limites par défaut (en MB)
const DEFAULT_LIMITS: Record<MediaType, number> = {
  image: 10,
  audio: 50,
  video: 200,
}

/**
 * Génère un nom de fichier unique
 */
function generateFileName(originalName: string, type: MediaType): string {
  // Extraire l'extension seulement si le nom contient un point
  // et que l'extension est valide (pas le nom entier)
  const parts = originalName.split('.')
  const potentialExt = parts.length > 1 ? parts.pop()?.toLowerCase() : null
  
  // Vérifier que c'est une vraie extension (courte et alphanumérique)
  const validExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg']
  const ext = (potentialExt && validExtensions.includes(potentialExt)) 
    ? potentialExt 
    : getDefaultExtension(type)
  
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}.${ext}`
}

/**
 * Extension par défaut selon le type
 */
function getDefaultExtension(type: MediaType): string {
  switch (type) {
    case 'image': return 'png'
    case 'audio': return 'webm'
    case 'video': return 'mp4'
  }
}

/**
 * Valide le type MIME
 */
function isValidMimeType(mimeType: string, type: MediaType): boolean {
  const validTypes: Record<MediaType, string[]> = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4'],
    video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  }
  return validTypes[type].some(t => mimeType.startsWith(t.split('/')[0]))
}

/**
 * Compresse une image si nécessaire
 */
async function compressImage(file: File, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      
      // Limite la taille max à 2000px
      let { width, height } = img
      const maxSize = 2000
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize
          width = maxSize
        } else {
          width = (width / height) * maxSize
          height = maxSize
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Compression failed'))
          }
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Hook principal pour l'upload de médias
 */
export function useMediaUpload(): UseMediaUploadReturn {
  const { user, profile } = useAuthStore()
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  /**
   * Upload une VIDÉO vers R2 (via API route)
   */
  const uploadVideoToR2 = useCallback(async (
    file: File | Blob,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    const { source = 'upload', storyId } = options

    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', user!.id)
    formData.append('profileId', profile?.id || '')
    formData.append('source', source)
    if (storyId) formData.append('storyId', storyId)

    setProgress(30)

    const response = await fetch('/api/upload/video', {
      method: 'POST',
      body: formData,
    })

    setProgress(90)

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Erreur upload vidéo')
    }

    const result = await response.json()
    setProgress(100)

    return result

  }, [user, profile])

  /**
   * Upload une IMAGE ou AUDIO vers Supabase Storage
   */
  const uploadToSupabase = useCallback(async (
    file: File | Blob,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    const { type, source = 'upload', storyId, quality } = options
    const bucket = TYPE_TO_BUCKET[type as 'image' | 'audio']

    console.log('📤 [1/5] Début uploadToSupabase, bucket:', bucket)

    // Compresser les images si demandé
    let fileToUpload: File | Blob = file
    if (type === 'image' && quality && quality < 1) {
      fileToUpload = await compressImage(file as File, quality)
      setProgress(30)
    }

    // Générer le nom du fichier
    const originalName = file instanceof File ? file.name : `media.${getDefaultExtension(type)}`
    const fileName = generateFileName(originalName, type)
    const filePath = `${user!.id}/${fileName}`

    console.log('📤 [2/5] Fichier préparé:', fileName, `(${(fileToUpload.size / 1024).toFixed(1)} KB)`)
    setProgress(40)

    // Upload vers Supabase Storage avec timeout
    console.log('📤 [3/5] Upload vers Supabase Storage...')
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ [3/5] Erreur upload storage:', uploadError.message)
      throw new Error(`Erreur upload: ${uploadError.message}`)
    }

    console.log('📤 [3/5] Upload storage OK')
    setProgress(70)

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl
    const mimeType = file.type || `${type}/${getDefaultExtension(type)}`

    console.log('📤 [4/5] URL publique obtenue:', publicUrl.substring(0, 60) + '...')
    setProgress(80)

    // Créer l'entrée dans la table assets
    console.log('📤 [5/5] Création entrée dans table assets...')
    const assetInsert = {
      profile_id: profile?.id,
      story_id: storyId || null,
      type: type as 'image' | 'audio' | 'video',
      source: source as 'upload' | 'midjourney' | 'elevenlabs' | 'runway' | 'luma' | 'gemini' | 'dalle',
      url: publicUrl,
      file_name: fileName,
      file_size: fileToUpload.size,
      mime_type: mimeType,
    }
    
    console.log('📤 [5/5] Insert data:', { profile_id: profile?.id, type, source, fileName })
    
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(assetInsert as any)
      .select()
      .single()

    if (assetError) {
      console.error('❌ [5/5] Erreur création asset:', assetError.message, assetError)
      // Rollback : supprimer le fichier uploadé
      await supabase.storage.from(bucket).remove([filePath])
      throw new Error(`Erreur création asset: ${assetError.message}`)
    }

    console.log('✅ [5/5] Asset créé avec succès')
    setProgress(100)

    // Cast nécessaire car les types Supabase peuvent être désynchronisés
    const asset = assetData as unknown as { id: string }

    return {
      url: publicUrl,
      assetId: asset.id,
      fileName,
      fileSize: fileToUpload.size,
      mimeType,
    }

  }, [user, profile])

  /**
   * Upload un fichier (routage automatique selon le type)
   */
  const upload = useCallback(async (
    file: File | Blob,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    if (!user) {
      setError('Utilisateur non connecté')
      return null
    }
    
    if (!profile?.id) {
      setError('Profil non chargé - rafraîchis la page')
      console.error('❌ Upload impossible: profile.id manquant')
      return null
    }

    const { type, maxSizeMB } = options
    const limit = maxSizeMB || DEFAULT_LIMITS[type]

    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Vérifier la taille
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > limit) {
        throw new Error(`Fichier trop volumineux (max ${limit} MB)`)
      }

      // Vérifier le type MIME
      const mimeType = file.type || `${type}/${getDefaultExtension(type)}`
      if (!isValidMimeType(mimeType, type)) {
        throw new Error(`Type de fichier non supporté`)
      }

      setProgress(10)

      // Router vers le bon service
      if (type === 'video') {
        // Vidéos → R2 via API
        return await uploadVideoToR2(file, options)
      } else {
        // Images & Audio → Supabase
        return await uploadToSupabase(file, options)
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(message)
      console.error('Upload error:', err)
      return null
    } finally {
      setIsUploading(false)
    }
  }, [user, uploadVideoToR2, uploadToSupabase])

  /**
   * Upload depuis une URL (pour les médias générés par IA)
   */
  const uploadFromUrl = useCallback(async (
    url: string,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    try {
      setIsUploading(true)
      setProgress(0)
      setError(null)

      console.log('📥 Téléchargement depuis URL:', url.substring(0, 80) + '...')

      // Télécharger le fichier depuis l'URL avec timeout de 60 secondes
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)
      
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Impossible de télécharger le fichier (${response.status})`)
      }

      setProgress(20)
      console.log('📥 Téléchargement OK, conversion en blob...')

      const blob = await response.blob()
      console.log(`📥 Blob créé: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
      setProgress(40)

      // Utiliser la fonction upload standard
      console.log('📤 Début upload vers stockage...')
      const result = await upload(blob, options)
      console.log('📤 Upload terminé:', result ? 'succès' : 'échec')
      return result

    } catch (err) {
      const message = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Téléchargement trop long (timeout 60s)' : err.message)
        : 'Erreur inconnue'
      setError(message)
      console.error('❌ Upload from URL error:', err)
      return null
    } finally {
      // S'assurer que isUploading est reset même en cas d'erreur
      setIsUploading(false)
    }
  }, [upload])

  /**
   * Supprimer un média
   */
  const deleteMedia = useCallback(async (assetId: string, type: MediaType): Promise<boolean> => {
    if (!user) {
      setError('Utilisateur non connecté')
      return false
    }

    try {
      if (type === 'video') {
        // Vidéos → API R2
        const response = await fetch(`/api/upload/video?assetId=${assetId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erreur suppression vidéo')
        }

        return true

      } else {
        // Images & Audio → Supabase
        const bucket = TYPE_TO_BUCKET[type as 'image' | 'audio']

        // Récupérer les infos de l'asset
        const { data: assetResult, error: fetchError } = await supabase
          .from('assets')
          .select('*')
          .eq('id', assetId)
          .single()

        if (fetchError || !assetResult) {
          throw new Error('Asset non trouvé')
        }

        // Cast nécessaire car les types Supabase peuvent être désynchronisés
        const asset = assetResult as unknown as { url: string }

        // Extraire le chemin du fichier depuis l'URL
        const urlParts = asset.url.split(`/${bucket}/`)
        if (urlParts.length >= 2) {
          const filePath = urlParts[1]
          await supabase.storage.from(bucket).remove([filePath])
        }

        // Supprimer l'entrée de la table assets
        const { error: deleteError } = await supabase
          .from('assets')
          .delete()
          .eq('id', assetId)

        if (deleteError) {
          throw new Error(`Erreur suppression: ${deleteError.message}`)
        }

        return true
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(message)
      console.error('Delete error:', err)
      return false
    }
  }, [user])

  return {
    upload,
    uploadFromUrl,
    deleteMedia,
    isUploading,
    progress,
    error,
  }
}

export default useMediaUpload
