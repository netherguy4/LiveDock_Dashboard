import { requireAdmin } from '../../../utils/auth-subject'
import { useAppStorage } from '../../../utils/storage'
import { publicUser } from '../../../utils/users'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const users = await useAppStorage().listUsers()
  return users.map(publicUser)
})
