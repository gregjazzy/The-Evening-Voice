/**
 * Script pour créer un compte admin
 * Usage: npx tsx scripts/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables Supabase manquantes!')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdmin() {
  console.log('🚀 Création du compte admin...\n')

  const email = 'admin@admin.com'
  const password = 'admin123'
  const name = 'Admin'
  const role = 'mentor'

  try {
    // 1. Créer l'utilisateur
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  L\'utilisateur existe déjà, tentative de connexion...')
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          console.error('❌ Erreur de connexion:', signInError.message)
          return
        }

        console.log('✅ Connexion réussie!')
        console.log('\n📋 Identifiants:')
        console.log(`   Email: ${email}`)
        console.log(`   Mot de passe: ${password}`)
        return
      }

      console.error('❌ Erreur création utilisateur:', authError.message)
      return
    }

    if (!authData.user) {
      console.error('❌ Pas d\'utilisateur créé')
      return
    }

    console.log('✅ Utilisateur créé:', authData.user.id)

    // 2. Créer le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        name,
        role,
        missions_completed: 0,
        badges: [],
        skills_unlocked: [],
      })

    if (profileError) {
      console.error('⚠️  Erreur création profil:', profileError.message)
      console.log('   (Le profil sera créé à la première connexion)')
    } else {
      console.log('✅ Profil créé!')
    }

    console.log('\n' + '═'.repeat(50))
    console.log('🎉 COMPTE ADMIN CRÉÉ AVEC SUCCÈS!')
    console.log('═'.repeat(50))
    console.log('\n📋 Identifiants:')
    console.log(`   Email: ${email}`)
    console.log(`   Mot de passe: ${password}`)
    console.log(`   Rôle: ${role}`)
    console.log('\n🔗 Connecte-toi sur: http://localhost:3000/login')
    console.log('')

  } catch (error: any) {
    console.error('❌ Erreur inattendue:', error.message)
  }
}

createAdmin()

