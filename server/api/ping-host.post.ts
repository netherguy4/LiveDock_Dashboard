// Validates a host URL before the client adds it. The browser sends { url, token? }
// and we try a quick GET to the upstream's /api/snapshot. Returns { ok: true } or
// { ok: false, error } so the UI can surface a meaningful message.
export default defineEventHandler(async (event) => {
  const body = await readBody<{ url: string; token?: string }>(event)
  if (!body?.url) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'URL is required' }
  }

  let baseUrl: string
  try {
    baseUrl = new URL(body.url).toString().replace(/\/$/, '')
  } catch {
    setResponseStatus(event, 400)
    return { ok: false, error: 'Invalid URL format' }
  }

  try {
    const headers: Record<string, string> = {}
    if (body.token) headers.Authorization = `Bearer ${body.token}`

    await $fetch(`${baseUrl}/api/snapshot`, {
      method: 'GET',
      headers,
      timeout: 8000,
    })

    return { ok: true }
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string; cause?: { code?: string } }
    const msg =
      e?.statusCode === 401
        ? 'Authentication failed — check the token'
        : e?.cause?.code === 'ECONNREFUSED' || e?.cause?.code === 'ENOTFOUND'
          ? 'Host is unreachable'
          : e?.message || 'Could not reach host'

    return { ok: false, error: msg }
  }
})
