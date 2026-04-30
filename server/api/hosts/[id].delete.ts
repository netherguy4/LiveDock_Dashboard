import { createError } from 'h3'
import { requireUser } from '../../utils/auth-subject'
import { useAppStorage } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const session = requireUser(event)
  const id = getRouterParam(event, 'id') || ''
  const deleted = await useAppStorage().deleteHost(session.userId, id)
  if (!deleted) throw createError({ statusCode: 404, statusMessage: 'host not found' })
  return { ok: true }
})
