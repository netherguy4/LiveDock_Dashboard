import { createError } from 'h3'
import { requireUser } from '../../utils/auth-subject'
import { publicHost, sanitizeHostPatch } from '../../utils/hosts'
import { useAppStorage } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const session = requireUser(event)
  const id = getRouterParam(event, 'id') || ''
  const input = sanitizeHostPatch(await readBody(event))
  const host = await useAppStorage().updateHost(session.userId, id, input)
  if (!host) throw createError({ statusCode: 404, statusMessage: 'host not found' })
  return publicHost(host)
})
