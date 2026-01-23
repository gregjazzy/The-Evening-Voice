/**
 * Script pour corriger les fichiers avec extension .blob
 * Ces fichiers sont des vidéos mal nommées lors de l'import
 * 
 * Usage: npx ts-node scripts/fix-blob-extensions.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixBlobExtensions() {
  console.log('🔧 Correction des extensions .blob...\n')

  // Récupérer tous les assets avec extension .blob
  const { data: assets, error } = await supabase
    .from('assets')
    .select('*')
    .like('file_name', '%.blob')

  if (error) {
    console.error('❌ Erreur récupération assets:', error.message)
    return
  }

  if (!assets || assets.length === 0) {
    console.log('✅ Aucun fichier .blob trouvé !')
    return
  }

  console.log(`📦 ${assets.length} fichier(s) .blob trouvé(s):\n`)

  for (const asset of assets) {
    const oldName = asset.file_name
    const newName = oldName.replace('.blob', asset.type === 'video' ? '.mp4' : '.png')
    
    console.log(`   📄 ${oldName}`)
    console.log(`      Type: ${asset.type}`)
    console.log(`      → Nouveau nom: ${newName}`)

    // Mettre à jour le nom dans la DB
    const { error: updateError } = await supabase
      .from('assets')
      .update({ file_name: newName })
      .eq('id', asset.id)

    if (updateError) {
      console.log(`      ❌ Erreur: ${updateError.message}`)
    } else {
      console.log(`      ✅ Corrigé !`)
    }
    console.log()
  }

  console.log('🎉 Terminé !')
}

fixBlobExtensions()
