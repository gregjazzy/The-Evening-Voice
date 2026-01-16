/**
 * Script pour confirmer l'email de l'admin
 * Usage: npx tsx scripts/confirm-admin.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function confirmAdmin() {
  console.log('🔍 Recherche de admin@admin.com...')
  
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('❌ Erreur:', error.message)
    return
  }
  
  const adminUser = data.users.find(u => u.email === 'admin@admin.com')
  if (!adminUser) {
    console.log('❌ Utilisateur admin@admin.com non trouvé')
    return
  }
  
  console.log('✅ Utilisateur trouvé:', adminUser.id)
  console.log('   Email confirmé:', adminUser.email_confirmed_at ? 'Oui' : 'Non')
  
  if (adminUser.email_confirmed_at) {
    console.log('ℹ️  L\'email est déjà confirmé')
    return
  }
  
  // Confirmer l'email
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    adminUser.id,
    { email_confirm: true }
  )
  
  if (updateError) {
    console.error('❌ Erreur confirmation:', updateError.message)
  } else {
    console.log('✅ Email confirmé avec succès!')
    console.log('\n📋 Tu peux maintenant te connecter avec:')
    console.log('   Email: admin@admin.com')
    console.log('   Mot de passe: admin123')
  }
}

confirmAdmin()
