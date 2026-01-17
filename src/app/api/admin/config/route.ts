/**
 * API Route pour la configuration admin
 * 
 * GET /api/admin/config - Récupère la config (clés masquées)
 * POST /api/admin/config - Met à jour les clés API
 * 
 * SÉCURITÉ : Accessible uniquement aux admins authentifiés
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Table Supabase pour stocker la config
const CONFIG_TABLE = 'app_config'

// Créer un client Supabase admin (bypass RLS)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Configuration Supabase manquante')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })
}

// Vérifier si l'utilisateur est admin
async function isAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  
  try {
    const supabase = getSupabaseAdmin()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) return false
    
    // Vérifier le rôle admin dans la table profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    return profile?.role === 'admin'
  } catch {
    return false
  }
}

// Liste des clés API configurables
const API_KEYS = [
  'MIDJOURNEY_API_KEY',
  'MIDJOURNEY_API_URL',
  'RUNWAY_API_KEY',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_NARRATOR',
  'ELEVENLABS_VOICE_FAIRY',
  'ELEVENLABS_VOICE_DRAGON',
  'ELEVENLABS_VOICE_DEFAULT',
  'LUMA_API_KEY',
  'MUX_TOKEN_ID',
  'MUX_TOKEN_SECRET',
  'GEMINI_API_KEY',
]

// GET - Récupérer la configuration (clés masquées)
export async function GET(request: NextRequest) {
  // Vérifier l'authentification admin
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  
  try {
    const supabase = getSupabaseAdmin()
    
    // Récupérer toutes les configs
    const { data, error } = await supabase
      .from(CONFIG_TABLE)
      .select('key, value, updated_at')
    
    if (error) {
      // Si la table n'existe pas, retourner une config vide
      if (error.code === '42P01') {
        return NextResponse.json({ 
          config: API_KEYS.reduce((acc, key) => ({ ...acc, [key]: { set: false, masked: '' } }), {}),
          needsSetup: true 
        })
      }
      throw error
    }
    
    // Masquer les clés (montrer seulement les 4 derniers caractères)
    const config: Record<string, { set: boolean; masked: string; updatedAt?: string }> = {}
    
    for (const key of API_KEYS) {
      const found = data?.find(d => d.key === key)
      if (found && found.value) {
        const value = found.value as string
        config[key] = {
          set: true,
          masked: value.length > 4 ? '•'.repeat(value.length - 4) + value.slice(-4) : '••••',
          updatedAt: found.updated_at,
        }
      } else {
        config[key] = { set: false, masked: '' }
      }
    }
    
    return NextResponse.json({ config, needsSetup: false })
  } catch (error) {
    console.error('Erreur récupération config:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Mettre à jour les clés API
export async function POST(request: NextRequest) {
  // Vérifier l'authentification admin
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { updates } = body as { updates: Record<string, string> }
    
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 })
    }
    
    const supabase = getSupabaseAdmin()
    
    // Mettre à jour chaque clé
    for (const [key, value] of Object.entries(updates)) {
      // Vérifier que la clé est autorisée
      if (!API_KEYS.includes(key)) {
        continue
      }
      
      // Upsert (insert or update)
      const { error } = await supabase
        .from(CONFIG_TABLE)
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        })
      
      if (error) {
        console.error(`Erreur mise à jour ${key}:`, error)
      }
    }
    
    return NextResponse.json({ success: true, message: 'Configuration mise à jour' })
  } catch (error) {
    console.error('Erreur mise à jour config:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
