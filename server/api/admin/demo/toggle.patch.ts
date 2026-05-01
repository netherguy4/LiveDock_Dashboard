import { requireAdmin } from '../../../utils/auth-subject'
import { useAppStorage } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody<{ enabled?: boolean }>(event)
  if (typeof body?.enabled !== 'boolean') {
    setResponseStatus(event, 400)
    return { error: 'enabled (boolean) is required' }
  }

  const storage = useAppStorage()
  const user = await storage.getUserByLogin('demo')
  if (!user) {
    setResponseStatus(event, 404)
    return { error: 'demo user not found' }
  }

  await storage.setDemoFlag(user.id, body.enabled)
  return { login: user.login, demo: body.enabled }
})
