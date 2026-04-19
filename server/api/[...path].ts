export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const path = getRouterParam(event, 'path') || ''
  const query = getQuery(event)
  const method = event.method

  const url = new URL(`/api/${path}`, config.apiUrl)
  for (const [k, v] of Object.entries(query)) {
    if (v != null) url.searchParams.set(k, String(v))
  }

  let body: any = undefined
  if (method !== 'GET' && method !== 'HEAD') {
    body = await readBody(event).catch(() => undefined)
  }

  try {
    return await $fetch(url.toString(), {
      method: method as any,
      headers: { Authorization: `Bearer ${config.apiToken}` },
      body,
      timeout: 15000,
    })
  } catch (err: any) {
    setResponseStatus(event, err?.statusCode || 502)
    return { error: err?.data?.error || err?.message || 'proxy error' }
  }
})
