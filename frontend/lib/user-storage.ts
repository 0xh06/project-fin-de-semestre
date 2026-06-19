import { defaultAvatar, normalizeAvatarConfig, USER_UPDATED_EVENT } from '@/lib/avatar'
import type { User } from '@/types'

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem('user')
  if (!stored) return null

  try {
    const user = JSON.parse(stored) as User
    return {
      ...user,
      avatar: normalizeAvatarConfig(user.avatar),
    }
  } catch {
    return null
  }
}

export function setStoredUser(user: User) {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    'user',
    JSON.stringify({
      ...user,
      avatar: normalizeAvatarConfig(user.avatar),
    })
  )
  window.dispatchEvent(new Event(USER_UPDATED_EVENT))
}

export function mergeStoredUser(patch: Partial<User>) {
  const current = getStoredUser()
  if (!current) return null

  const nextUser: User = {
    ...current,
    ...patch,
    avatar: normalizeAvatarConfig(patch.avatar ?? current.avatar ?? defaultAvatar),
  }

  setStoredUser(nextUser)
  return nextUser
}

export function getUserAvatar(user?: Pick<User, 'avatar'> | null) {
  return normalizeAvatarConfig(user?.avatar ?? defaultAvatar)
}
