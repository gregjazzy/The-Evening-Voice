/**
 * Client Cloudflare R2 pour le stockage des vidéos
 * 
 * Configuration requise dans .env.local :
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 * - R2_PUBLIC_URL (URL publique du bucket)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Configuration R2 (compatible S3)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'lavoixdusoir-videos'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

// Client S3 compatible pour R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

/**
 * Upload un fichier vidéo vers R2
 */
export async function uploadToR2(
  file: Buffer | Uint8Array,
  fileName: string,
  contentType: string,
  userId: string
): Promise<{ url: string; key: string }> {
  const key = `videos/${userId}/${fileName}`
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // 1 an de cache
  })

  await r2Client.send(command)

  const url = `${R2_PUBLIC_URL}/${key}`
  
  return { url, key }
}

/**
 * Supprimer un fichier de R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  await r2Client.send(command)
}

/**
 * Vérifie si R2 est configuré
 */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_URL)
}

export { R2_PUBLIC_URL, R2_BUCKET_NAME }
