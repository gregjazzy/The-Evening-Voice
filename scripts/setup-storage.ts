#!/usr/bin/env npx tsx
/**
 * Script de configuration du Storage Supabase
 * 
 * Usage: npx tsx scripts/setup-storage.ts
 * 
 * Ce script :
 * 1. Crée les buckets images et audio (pas videos - elles vont sur R2)
 * 2. Configure les policies de sécurité
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Charger .env.local
config({ path: '.env.local' })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Debug: afficher les variables chargées
console.log('🔍 Debug - Variables détectées:')
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL ? '✅ définie' : '❌ manquante'}`)
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY ? '✅ définie' : '❌ manquante'}`)
console.log('')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes!')
  console.error('')
  console.error('   Ajouter dans .env.local:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
  console.error('')
  console.error('   Trouver le Service Role Key:')
  console.error('   Dashboard Supabase → Settings → API → service_role key')
  process.exit(1)
}

// Client admin avec Service Role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Buckets à créer
const BUCKETS = [
  {
    id: 'images',
    name: 'images',
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB
  },
  {
    id: 'audio',
    name: 'audio',
    public: true,
    allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4'],
    fileSizeLimit: 50 * 1024 * 1024, // 50 MB
  },
]

async function createBucket(bucket: typeof BUCKETS[0]) {
  console.log(`\n📦 Création du bucket "${bucket.id}"...`)

  // Vérifier si le bucket existe déjà
  const { data: existingBuckets } = await supabase.storage.listBuckets()
  const exists = existingBuckets?.some(b => b.id === bucket.id)

  if (exists) {
    console.log(`   ⚠️  Le bucket "${bucket.id}" existe déjà`)
    
    // Mettre à jour les paramètres
    const { error: updateError } = await supabase.storage.updateBucket(bucket.id, {
      public: bucket.public,
      allowedMimeTypes: bucket.allowedMimeTypes,
      fileSizeLimit: bucket.fileSizeLimit,
    })

    if (updateError) {
      console.error(`   ❌ Erreur mise à jour: ${updateError.message}`)
    } else {
      console.log(`   ✅ Paramètres mis à jour`)
    }
    return
  }

  // Créer le bucket
  const { error } = await supabase.storage.createBucket(bucket.id, {
    public: bucket.public,
    allowedMimeTypes: bucket.allowedMimeTypes,
    fileSizeLimit: bucket.fileSizeLimit,
  })

  if (error) {
    console.error(`   ❌ Erreur création: ${error.message}`)
  } else {
    console.log(`   ✅ Bucket créé avec succès`)
    console.log(`   📋 Public: ${bucket.public}`)
    console.log(`   📋 Types autorisés: ${bucket.allowedMimeTypes.join(', ')}`)
    console.log(`   📋 Taille max: ${bucket.fileSizeLimit / (1024 * 1024)} MB`)
  }
}

async function setupPolicies() {
  console.log('\n🔐 Configuration des policies RLS...')
  console.log('   ⚠️  Les policies doivent être créées via le SQL Editor Supabase')
  console.log('   📄 Exécutez le contenu de: supabase/storage-policies.sql')
  console.log('')
  console.log('   Ou utilisez cette commande:')
  console.log('   npx supabase db push --include-all')
}

async function listBuckets() {
  console.log('\n📋 Liste des buckets existants:')
  const { data: buckets, error } = await supabase.storage.listBuckets()
  
  if (error) {
    console.error(`   ❌ Erreur: ${error.message}`)
    return
  }

  if (!buckets || buckets.length === 0) {
    console.log('   (aucun bucket)')
    return
  }

  for (const bucket of buckets) {
    console.log(`   - ${bucket.id} (public: ${bucket.public})`)
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗')
  console.log('║    LA VOIX DU SOIR - Setup Storage Supabase       ║')
  console.log('╚═══════════════════════════════════════════════════╝')
  console.log('')
  console.log('🔗 URL Supabase:', SUPABASE_URL)
  console.log('')
  console.log('📌 Architecture hybride:')
  console.log('   • Images → Supabase Storage (bucket "images")')
  console.log('   • Audio  → Supabase Storage (bucket "audio")')
  console.log('   • Vidéos → Cloudflare R2 (externe)')

  // Lister les buckets existants
  await listBuckets()

  // Créer les buckets
  for (const bucket of BUCKETS) {
    await createBucket(bucket)
  }

  // Instructions pour les policies
  await setupPolicies()

  // Lister les buckets après création
  await listBuckets()

  console.log('\n✅ Setup terminé!')
  console.log('')
  console.log('🚀 Prochaines étapes:')
  console.log('   1. Exécuter les policies SQL dans le dashboard Supabase')
  console.log('   2. Configurer Cloudflare R2 pour les vidéos')
  console.log('   3. Ajouter les variables R2 dans .env.local')
  console.log('')
}

main().catch(console.error)
