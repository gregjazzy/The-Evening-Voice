#!/usr/bin/env npx tsx
/**
 * Applique les policies RLS pour le Storage Supabase
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Policies à créer (une par une pour gérer les erreurs)
const POLICIES = [
  // Images - SELECT
  {
    name: 'Images are publicly accessible',
    sql: `CREATE POLICY "Images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'images');`
  },
  // Images - INSERT
  {
    name: 'Authenticated users can upload images',
    sql: `CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');`
  },
  // Images - UPDATE
  {
    name: 'Users can update own images',
    sql: `CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);`
  },
  // Images - DELETE
  {
    name: 'Users can delete own images',
    sql: `CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);`
  },
  // Audio - SELECT
  {
    name: 'Audio files are publicly accessible',
    sql: `CREATE POLICY "Audio files are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'audio');`
  },
  // Audio - INSERT
  {
    name: 'Authenticated users can upload audio',
    sql: `CREATE POLICY "Authenticated users can upload audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio' AND auth.role() = 'authenticated');`
  },
  // Audio - UPDATE
  {
    name: 'Users can update own audio',
    sql: `CREATE POLICY "Users can update own audio" ON storage.objects FOR UPDATE USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);`
  },
  // Audio - DELETE
  {
    name: 'Users can delete own audio',
    sql: `CREATE POLICY "Users can delete own audio" ON storage.objects FOR DELETE USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);`
  },
]

async function main() {
  console.log('🔐 Application des policies Storage...\n')

  for (const policy of POLICIES) {
    process.stdout.write(`   ${policy.name}... `)
    
    const { error } = await supabase.rpc('exec_sql', { sql: policy.sql }).single()
    
    if (error) {
      if (error.message?.includes('already exists')) {
        console.log('⚠️  existe déjà')
      } else if (error.message?.includes('function') || error.code === 'PGRST202') {
        // La fonction exec_sql n'existe pas, on skip
        console.log('⏭️  (nécessite SQL Editor)')
      } else {
        console.log(`❌ ${error.message}`)
      }
    } else {
      console.log('✅')
    }
  }

  console.log('\n📌 Si les policies n\'ont pas pu être appliquées automatiquement,')
  console.log('   exécute le SQL manuellement :')
  console.log('   Dashboard Supabase → SQL Editor → Colle le contenu de supabase/storage-policies.sql')
}

main().catch(console.error)
