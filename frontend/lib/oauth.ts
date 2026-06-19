import { API_BASE_URL } from '@/lib/api'

export type OAuthProvider = 'github' | 'google'
export type OAuthFlow = 'login' | 'register'

function getStorageKey(provider: OAuthProvider, flow: OAuthFlow) {
  return `oauth_state:${provider}:${flow}`
}

function createOAuthState() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '')
  }

  return `${Date.now()}${Math.random().toString(16).slice(2)}`
}

async function assertApiAvailable() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })
  } catch (error) {
    const networkError = new Error(
      `Impossible de joindre l'API sur ${API_BASE_URL}. Vérifie que le backend est démarré.`
    ) as Error & { code?: string; cause?: unknown }

    networkError.code = 'api_unreachable'
    networkError.cause = error
    throw networkError
  }
}

export async function beginOAuth(provider: OAuthProvider, flow: OAuthFlow) {
  const state = createOAuthState()
  const storageKey = getStorageKey(provider, flow)

  sessionStorage.setItem(storageKey, state)

  try {
    await assertApiAvailable()
  } catch (error) {
    sessionStorage.removeItem(storageKey)
    throw error
  }

  window.location.href = `${API_BASE_URL}/api/auth/${provider}?flow=${flow}&client_state=${state}`
}

export function verifyOAuthState(provider: string | null, flow: OAuthFlow, receivedState: string | null) {
  if (!provider || (provider !== 'github' && provider !== 'google') || !receivedState) {
    return false
  }

  const key = getStorageKey(provider, flow)
  const expectedState = sessionStorage.getItem(key)
  sessionStorage.removeItem(key)

  return Boolean(expectedState) && expectedState === receivedState
}

export function getAuthErrorMessage(errorCode: string | null) {
  switch (errorCode) {
    case 'oauth_failed':
      return 'La connexion avec le fournisseur externe a échoué.'
    case 'api_unreachable':
      return `Le serveur backend n'est pas démarré (${API_BASE_URL}). Tu peux continuer en mode démo sans connexion.`
    case 'oauth_misconfigured':
      return 'GitHub ou Google est mal configuré côté serveur. Vérifie le client ID et le client secret.'
    case 'oauth_state_invalid':
      return 'La vérification de sécurité OAuth a échoué. Réessaie.'
    case 'oauth_cancelled':
      return 'L’autorisation OAuth a été annulée.'
    case 'invalid_credentials':
      return 'Email ou mot de passe incorrect.'
    case 'email_already_exists':
      return 'Un compte existe déjà avec cet email.'
    case 'oauth_account_conflict':
      return 'Ce fournisseur est déjà lié à un autre compte.'
    case 'oauth_link_failed':
      return 'Impossible de lier ce compte OAuth pour le moment.'
    case 'invalid_request':
      return 'Les informations envoyées sont incomplètes ou invalides.'
    case 'invalid_password':
      return 'Le mot de passe doit contenir au moins 8 caractères.'
    case 'invalid_email':
      return 'L’adresse email n’est pas valide.'
    case 'invalid_username':
      return 'Le nom d’utilisateur est invalide.'
    case 'server_error':
      return 'Une erreur serveur est survenue. Réessaie dans un instant.'
    case 'unauthorized':
      return 'Tu dois être connecté pour accéder à cette page.'
    default:
      return ''
  }
}
