import { createError } from 'h3'
import { requireAdmin } from '../../../utils/auth-subject'
import { hashPassword } from '../../../utils/password'
import { useAppStorage } from '../../../utils/storage'
import { publicUser } from '../../../utils/users'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id') || ''
  const body = await readBody<{ login?: string; password?: string }>(event)
  const login = body.login?.trim()
  const password = body.password ?? ''
  if (login === '') throw createError({ statusCode: 400, statusMessage: 'login required' })

  try {
    const user = await useAppStorage().updateUser(id, {
      ...(login ? { login } : {}),
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    })
    if (!user) throw createError({ statusCode: 404, statusMessage: 'user not found' })
    return publicUser(user)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'login already exists') {
      throw createError({ statusCode: 409, statusMessage: 'login already exists' })
    }
    throw e
  }
})
