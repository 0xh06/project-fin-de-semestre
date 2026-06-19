import { createClient } from '@/utils/supabase/client'

type SupabaseOAuthProvider = 'google' | 'github'

async function signInWithProvider(provider: SupabaseOAuthProvider) {
  const supabase = createClient()
  const origin = window.location.origin

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  })

  if (error) throw error
  return data
}

export function signInWithGoogle() {
  return signInWithProvider('google')
}

export function signInWithGitHub() {
  return signInWithProvider('github')
}
