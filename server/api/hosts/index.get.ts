import { requireUser } from '../../utils/auth-subject'
import { publicHost } from '../../utils/hosts'
import { useAppStorage } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const session = requireUser(event)

  if (session.demo) {
    return [{ id: 'demo', name: 'demo-server', url: '', current: true }]
  }

  const hosts = await useAppStorage().listHosts(session.userId)
  return hosts.map(publicHost)
})
