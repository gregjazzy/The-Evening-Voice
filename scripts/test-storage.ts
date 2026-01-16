#!/usr/bin/env npx tsx
/**
 * Test des uploads Storage
 * Usage: npx tsx scripts/test-storage.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

config({ path: '.env.local' })

// === CONFIG ===
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!

// Clients
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

// Test data
const TEST_IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)
const TEST_VIDEO = Buffer.from('test video content for R2')

async function testSupabaseStorage() {
  console.log('\n📦 Test Supabase Storage (images)...')
  
  const fileName = `test/test-${Date.now()}.png`
  
  // Upload
  console.log('   Uploading test image...')
  const { data, error: uploadError } = await supabase.storage
    .from('images')
    .upload(fileName, TEST_IMAGE, {
      contentType: 'image/png',
    })

  if (uploadError) {
    console.log(`   ❌ Upload failed: ${uploadError.message}`)
    return false
  }
  console.log(`   ✅ Upload OK: ${fileName}`)

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(fileName)
  
  console.log(`   🔗 URL: ${urlData.publicUrl}`)

  // Cleanup
  console.log('   Cleaning up...')
  const { error: deleteError } = await supabase.storage
    .from('images')
    .remove([fileName])

  if (deleteError) {
    console.log(`   ⚠️  Cleanup failed: ${deleteError.message}`)
  } else {
    console.log('   🗑️  Test file deleted')
  }

  return true
}

async function testR2Storage() {
  console.log('\n📦 Test Cloudflare R2 (videos)...')
  
  const fileName = `test/test-${Date.now()}.mp4`
  
  // Upload
  console.log('   Uploading test video...')
  try {
    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: TEST_VIDEO,
      ContentType: 'video/mp4',
    }))
    console.log(`   ✅ Upload OK: ${fileName}`)
    console.log(`   🔗 URL: ${R2_PUBLIC_URL}/${fileName}`)

    // Cleanup
    console.log('   Cleaning up...')
    await r2Client.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
    }))
    console.log('   🗑️  Test file deleted')
    
    return true
  } catch (err: any) {
    console.log(`   ❌ Failed: ${err.message}`)
    return false
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗')
  console.log('║       LA VOIX DU SOIR - Test Storage              ║')
  console.log('╚═══════════════════════════════════════════════════╝')

  // Check config
  console.log('\n🔍 Configuration:')
  console.log(`   Supabase: ${SUPABASE_URL ? '✅' : '❌'}`)
  console.log(`   R2 Account: ${R2_ACCOUNT_ID ? '✅' : '❌'}`)
  console.log(`   R2 Bucket: ${R2_BUCKET_NAME}`)
  console.log(`   R2 Public URL: ${R2_PUBLIC_URL}`)

  const results = {
    supabase: await testSupabaseStorage(),
    r2: await testR2Storage(),
  }

  console.log('\n═══════════════════════════════════════════════════')
  console.log('📊 Résultats:')
  console.log(`   Supabase Storage: ${results.supabase ? '✅ OK' : '❌ FAILED'}`)
  console.log(`   Cloudflare R2:    ${results.r2 ? '✅ OK' : '❌ FAILED'}`)
  console.log('')

  if (results.supabase && results.r2) {
    console.log('🎉 Tout fonctionne ! Prêt pour l\'intégration.')
  } else {
    console.log('⚠️  Des erreurs ont été détectées.')
    process.exit(1)
  }
}

main().catch(console.error)
