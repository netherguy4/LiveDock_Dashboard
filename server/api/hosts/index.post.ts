import { requireUser } from '../../utils/auth-subject'
import { publicHost, sanitizeHost } from '../../utils/hosts'
import { useAppStorage } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const session = requireUser(event)
  const input = sanitizeHost(await readBody(event))
  const host = await useAppStorage().createHost(session.userId, input)
  return publicHost(host)
})
