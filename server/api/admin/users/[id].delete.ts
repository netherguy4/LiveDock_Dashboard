import { createError } from 'h3'
import { requireAdmin } from '../../../utils/auth-subject'
import { useAppStorage } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id') || ''
  const deleted = await useAppStorage().deleteUser(id)
  if (!deleted) throw createError({ statusCode: 404, statusMessage: 'user not found' })
  return { ok: true }
})
