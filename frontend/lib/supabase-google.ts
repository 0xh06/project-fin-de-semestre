import { createClient } from '@/utils/supabase/client'

export async function signInWithGoogle() {
  const supabase = createClient()
  const origin = window.location.origin

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  })

  if (error) throw error
  return data
}
