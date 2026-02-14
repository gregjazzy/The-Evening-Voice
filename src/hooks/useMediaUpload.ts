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
import type { Session } from '@supabase/supabase-js'

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
 * Vérifie que le token est frais avant un upload.
 * Si le token expire dans < 5 minutes, le rafraîchit proactivement via Supabase Auth.
 * Cela couvre le cas où l'onglet était en arrière-plan (TOKEN_REFRESHED non reçu).
 */
async function ensureFreshToken(session: Session | null): Promise<string> {
  if (!session?.access_token) {
    throw new Error('Session expirée — reconnecte-toi')
  }

  const expiresAt = session.expires_at // Unix timestamp en secondes
  const now = Math.floor(Date.now() / 1000)
  const timeLeft = (expiresAt || 0) - now

  if (timeLeft > 300) {
    // Token encore valide pour > 5 min
    return session.access_token
  }

  // Token expiré ou expire bientôt → rafraîchir
  console.log(`🔄 Token expire dans ${timeLeft}s, rafraîchissement...`)

  const { data, error } = await supabase.auth.refreshSession()
  if (error || !data.session) {
    throw new Error('Session expirée — reconnecte-toi')
  }

  // Mettre à jour le store Zustand avec le nouveau token
  useAuthStore.setState({ session: data.session })

  const newTimeLeft = (data.session.expires_at || 0) - Math.floor(Date.now() / 1000)
  console.log(`🔄 Token rafraîchi, expire dans ${newTimeLeft}s`)

  return data.session.access_token
}

/**
 * Hook principal pour l'upload de médias
 */
export function useMediaUpload(): UseMediaUploadReturn {
  const { user, profile, session } = useAuthStore()
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  /**
   * Upload une VIDÉO vers R2 via proxy serveur (évite CORS + limite Netlify)
   */
  const uploadVideoToR2 = useCallback(async (
    file: File | Blob,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    const { source = 'upload', storyId } = options
    const contentType = file.type || 'video/mp4'

    console.log('📹 [1/2] Upload vidéo via proxy serveur...')
    setProgress(10)

    // Envoyer le fichier au proxy qui upload côté serveur vers R2
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', user!.id)
    formData.append('profileId', profile?.id || '')
    formData.append('contentType', contentType)
    formData.append('source', source)
    if (storyId) formData.append('storyId', storyId)

    setProgress(30)

    const response = await fetch('/api/upload/r2-proxy', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Erreur upload vidéo: ${response.status}`)
    }

    const { publicUrl, assetId, fileName: finalFileName } = await response.json()

    console.log('📹 [2/2] Vidéo sauvegardée via proxy !')
    setProgress(100)

    return {
      url: publicUrl,
      assetId,
      fileName: finalFileName,
      fileSize: file.size,
      mimeType: contentType,
    }

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

    // Upload via fetch direct (contourne les problèmes de createBrowserClient + cookies)
    // ensureFreshToken vérifie l'expiration et rafraîchit si nécessaire (< 5 min restantes)
    const token = await ensureFreshToken(session)
    console.log('📤 [3/5] Token auth: OK')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`
    const contentType = fileToUpload.type || 'image/png'

    console.log('📤 [3/5] Upload vers Supabase Storage...', { uploadUrl: uploadUrl.slice(0, 80), size: fileToUpload.size, contentType })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)

    try {
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || anonKey}`,
          'apikey': anonKey,
          'Content-Type': contentType,
          'Cache-Control': 'max-age=3600',
          'x-upsert': 'false',
        },
        body: fileToUpload,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!uploadResponse.ok) {
        const errBody = await uploadResponse.text().catch(() => '')
        console.error('❌ [3/5] Erreur upload storage:', uploadResponse.status, errBody)
        throw new Error(`Erreur upload: ${uploadResponse.status} ${errBody}`)
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        console.error('❌ [3/5] Upload timeout (45s)')
        throw new Error('Upload timeout (45s) — vérifie ta connexion')
      }
      throw err
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

    // Créer l'entrée dans la table assets via raw fetch (même pattern que storage upload)
    // Le SDK Supabase browser deadlock sur fetchWithAuth après un gros upload
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

    // Raw fetch vers PostgREST (contourne le deadlock createBrowserClient)
    const insertUrl = `${supabaseUrl}/rest/v1/assets`
    const insertResponse = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token || anonKey}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(assetInsert),
    })

    if (!insertResponse.ok) {
      const errBody = await insertResponse.text().catch(() => '')
      console.error('❌ [5/5] Erreur création asset:', insertResponse.status, errBody)
      // Rollback : supprimer le fichier uploadé via raw fetch
      await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || anonKey}`,
          'apikey': anonKey,
        },
      })
      throw new Error(`Erreur création asset: ${insertResponse.status} ${errBody}`)
    }

    const insertedRows = await insertResponse.json()
    const assetData = Array.isArray(insertedRows) ? insertedRows[0] : insertedRows

    console.log('✅ [5/5] Asset créé avec succès')
    setProgress(100)

    return {
      url: publicUrl,
      assetId: assetData.id,
      fileName,
      fileSize: fileToUpload.size,
      mimeType,
    }

  }, [user, profile, session])

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
  }, [user, profile?.id, uploadVideoToR2, uploadToSupabase])

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

      const { type = 'image', source = 'upload', storyId } = options

      console.log('🚀 Transfert serveur-à-serveur:', url.substring(0, 80) + '...')
      setProgress(20)

      // Transfert via API serveur (fal.ai → Supabase directement, sans passer par le navigateur)
      const response = await fetch('/api/upload/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          userId: user!.id,
          profileId: profile?.id,
          storyId,
          source,
          type,
        }),
      })

      setProgress(80)

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(data.error || `Erreur serveur (${response.status})`)
      }

      const data = await response.json()
      console.log('✅ Transfert serveur terminé:', data.publicUrl?.substring(0, 60) + '...')
      setProgress(100)

      return {
        url: data.publicUrl,
        assetId: data.assetId,
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(message)
      console.error('❌ Upload from URL error:', err)
      return null
    } finally {
      setIsUploading(false)
    }
  }, [user, profile])

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
