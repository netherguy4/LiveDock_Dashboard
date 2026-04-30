import type { StoredUser } from './storage/types'

export function publicUser(user: StoredUser) {
  return {
    id: user.id,
    login: user.login,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}
