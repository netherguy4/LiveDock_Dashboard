export default defineEventHandler((event) => {
  const { login, password } = useRuntimeConfig()

  if (!password) return

  const header = getRequestHeader(event, 'authorization') || ''
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    const idx = decoded.indexOf(':')
    const user = idx >= 0 ? decoded.slice(0, idx) : decoded
    const pass = idx >= 0 ? decoded.slice(idx + 1) : ''
    if (user === login && pass === password) return
  }

  setResponseStatus(event, 401)
  setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="Monitoring", charset="UTF-8"')
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return 'Authentication required'
})
