import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { randomUUID } from 'crypto'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function createStory() {
  console.log('📖 Création d\'une histoire dans Supabase...\n')

  // Trouver le profil admin
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('name', 'Admin')
    .single()

  if (!profiles) {
    console.error('❌ Profil Admin non trouvé')
    return
  }

  const profileId = profiles.id
  const storyId = randomUUID()
  const page1Id = randomUUID()
  const page2Id = randomUUID()

  // Créer l'histoire
  const { error: storyError } = await supabase.from('stories').insert({
    id: storyId,
    profile_id: profileId,
    title: 'La forêt enchantée',
    author: 'Admin',
    status: 'in_progress',
    total_pages: 2,
    current_page: 1,
    metadata: { structure: 'free' },
  })

  if (storyError) {
    console.error('❌ Erreur création histoire:', storyError.message)
    return
  }

  console.log('✅ Histoire créée:', storyId)

  // Créer les pages
  const pages = [
    {
      id: page1Id,
      story_id: storyId,
      page_number: 1,
      title: 'Introduction',
      text_blocks: [{ content: 'Il était une fois, dans une forêt enchantée, une petite fille nommée Luna. Elle adorait explorer les sentiers secrets et parler aux animaux magiques. Un jour, elle découvrit une clairière lumineuse où dansaient des lucioles dorées.' }],
    },
    {
      id: page2Id,
      story_id: storyId,
      page_number: 2,
      title: 'La rencontre',
      text_blocks: [{ content: 'Au milieu de la clairière se trouvait un vieux chêne parlant. Il dit à Luna : Bienvenue, petite aventurière ! Je gardais un secret pour toi. Et il lui révéla l\'emplacement d\'un trésor caché sous ses racines.' }],
    },
  ]

  for (const page of pages) {
    const { error } = await supabase.from('story_pages').insert(page)
    if (error) {
      console.error('❌ Erreur page:', error.message)
    } else {
      console.log('✅ Page créée:', page.page_number)
    }
  }

  console.log('\n🎉 Histoire "La forêt enchantée" créée avec succès !')
  console.log('   Rafraîchis la page pour la voir.')
}

createStory()
