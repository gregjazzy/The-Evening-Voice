#!/usr/bin/env node
/**
 * Script de création d'utilisateur La Voix du Soir
 *
 * Usage: node scripts/create_user.mjs <prénom> <nom> <mot_de_passe> [role]
 * Exemple: node scripts/create_user.mjs Margot Rob Robbie child
 *
 * Rôles disponibles: child (défaut), parent, mentor
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Charger .env.local
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=').map(s => s.trim()))
    .filter(([k, v]) => k && v)
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const [,, firstName, lastName, password, role = 'child'] = process.argv

if (!firstName || !lastName || !password) {
  console.error('Usage: node scripts/create_user.mjs <prénom> <nom> <mot_de_passe> [role]')
  console.error('Exemple: node scripts/create_user.mjs Margot Rob Robbie child')
  process.exit(1)
}

const fullName = `${firstName} ${lastName}`
const slug = `${firstName}-${lastName}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
const uuid6 = Math.random().toString(36).slice(2, 8)
const email = `${slug}-${uuid6}@lavoixdusoir.app`

console.log(`Création du compte: ${fullName} (${role})`)
console.log(`Email généré: ${email}`)

// 1. Créer le user auth (le trigger Supabase crée automatiquement un profil)
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, role },
})

if (error) {
  console.error('Erreur création user:', error.message)
  process.exit(1)
}

const userId = data.user.id
console.log(`User auth créé: ${userId}`)

// 2. Attendre que le trigger crée le profil, puis le mettre à jour (pas d'insert !)
await new Promise(r => setTimeout(r, 1000))

const { error: updateError } = await supabase
  .from('profiles')
  .update({ name: fullName, role })
  .eq('user_id', userId)

if (updateError) {
  console.error('Erreur update profil:', updateError.message)
  // Fallback: le trigger n'a peut-être pas utilisé user_id, essayer par id
  const { error: updateError2 } = await supabase
    .from('profiles')
    .update({ name: fullName, role, user_id: userId })
    .eq('id', userId)

  if (updateError2) {
    console.error('Erreur fallback update:', updateError2.message)
    process.exit(1)
  }
}

// 3. Vérifier
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single()

if (profile) {
  console.log(`\nCompte créé avec succès:`)
  console.log(`  Prénom: ${firstName}`)
  console.log(`  Nom: ${lastName}`)
  console.log(`  Mot de passe: ${password}`)
  console.log(`  Rôle: ${profile.role}`)
  console.log(`  user_id: ${userId}`)
} else {
  console.error('Profil non trouvé après création')
  process.exit(1)
}
