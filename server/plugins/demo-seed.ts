import { hashPassword } from '../utils/password'
import { useAppStorage } from '../utils/storage'

export default defineNitroPlugin(async () => {
  const storage = useAppStorage()
  const existing = await storage.getUserByLogin('demo')
  if (existing) return

  const passwordHash = await hashPassword('demo')
  const user = await storage.createUser({ login: 'demo', passwordHash })
  await storage.setDemoFlag(user.id, true)
})
