// Minimal Supabase REST/Auth client without external dependency.
// Uses public anon key only. Never put the service_role key in the frontend.

import type { AuthResponse, User } from '@/types'

const URL_STORAGE_KEY = 'supabase_url'
const ANON_KEY_STORAGE_KEY = 'supabase_anon_key'

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export class SupabaseClientError extends Error {
  constructor(message: string, public code = 'supabase_error', public status = 0) {
    super(message)
    this.name = 'SupabaseClientError'
  }
}

function cleanUrl(url: string) {
  return url.trim().replace(/\/+$/, '')
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (envUrl && envAnonKey) {
    return { url: cleanUrl(envUrl), anonKey: envAnonKey.trim() }
  }

  if (typeof window === 'undefined') return null

  const localUrl = localStorage.getItem(URL_STORAGE_KEY) || ''
  const localAnonKey = localStorage.getItem(ANON_KEY_STORAGE_KEY) || ''

  if (!localUrl || !localAnonKey) return null
  return { url: cleanUrl(localUrl), anonKey: localAnonKey.trim() }
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (typeof window === 'undefined') return

  const nextUrl = cleanUrl(url)
  const nextAnonKey = anonKey.trim()

  if (nextUrl && nextAnonKey) {
    localStorage.setItem(URL_STORAGE_KEY, nextUrl)
    localStorage.setItem(ANON_KEY_STORAGE_KEY, nextAnonKey)
  } else {
    localStorage.removeItem(URL_STORAGE_KEY)
    localStorage.removeItem(ANON_KEY_STORAGE_KEY)
  }
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig())
}

async function supabaseFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig()
  if (!config) {
    throw new SupabaseClientError(
      'Supabase n’est pas configuré. Ajoute NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY, ou renseigne-les dans Paramètres.',
      'supabase_not_configured'
    )
  }

  const headers = new Headers(init.headers)
  headers.set('apikey', config.anonKey)
  headers.set('Authorization', `Bearer ${config.anonKey}`)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`${config.url}${path}`, { ...init, headers })
  } catch {
    throw new SupabaseClientError('Impossible de joindre Supabase. Vérifie l’URL du projet.', 'supabase_unreachable')
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || 'Erreur Supabase'
    throw new SupabaseClientError(message, data?.error || 'supabase_request_failed', response.status)
  }

  return data as T
}

function mapSupabaseUser(supabaseUser: any, fallbackEmail: string, fallbackUsername?: string): User {
  const meta = supabaseUser?.user_metadata || {}
  return {
    id: Number(String(supabaseUser?.id || '').replace(/\D/g, '').slice(0, 9)) || 1,
    username: meta.username || meta.name || fallbackUsername || fallbackEmail.split('@')[0] || 'Étudiant',
    email: supabaseUser?.email || fallbackEmail,
    created_at: supabaseUser?.created_at || new Date().toISOString(),
  }
}

export const supabaseAuth = {
  async signUp(email: string, password: string, username: string): Promise<AuthResponse> {
    const data = await supabaseFetch<any>('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        data: { username },
      }),
    })

    const token = data?.access_token || data?.session?.access_token
    const supabaseUser = data?.user

    if (!token && supabaseUser) {
      throw new SupabaseClientError(
        'Compte créé. Vérifie ton email pour confirmer ton compte Supabase, puis connecte-toi.',
        'supabase_email_confirmation_required'
      )
    }

    if (!token || !supabaseUser) {
      throw new SupabaseClientError('Réponse Supabase incomplète pendant l’inscription.', 'supabase_invalid_response')
    }

    return {
      token: `supabase_${token}`,
      user: mapSupabaseUser(supabaseUser, email, username),
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const data = await supabaseFetch<any>('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    const token = data?.access_token
    const supabaseUser = data?.user

    if (!token || !supabaseUser) {
      throw new SupabaseClientError('Email ou mot de passe Supabase incorrect.', 'invalid_credentials')
    }

    return {
      token: `supabase_${token}`,
      user: mapSupabaseUser(supabaseUser, email),
    }
  },

  async testConnection(): Promise<boolean> {
    await supabaseFetch('/auth/v1/settings', { method: 'GET' })
    return true
  },
}
