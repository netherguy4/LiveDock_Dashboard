import { createError } from 'h3'
import type { CreateHostInput, StoredHost, UpdateHostInput } from './storage/types'

type HostBody = {
  name?: string
  url?: string
  token?: string
}

export function publicHost(host: StoredHost) {
  return {
    id: host.id,
    name: host.name,
    url: host.url,
    current: false,
  }
}

export function sanitizeHost(input: HostBody): CreateHostInput {
  const name = (input.name ?? '').trim()
  const url = (input.url ?? '').trim()
  const token = (input.token ?? '').trim() || undefined
  if (!name) throw createError({ statusCode: 400, statusMessage: 'name required' })
  if (!url) throw createError({ statusCode: 400, statusMessage: 'url required' })
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'invalid host url' })
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid host url' })
  }
  return { name, url, token }
}

export function sanitizeHostPatch(input: HostBody): UpdateHostInput {
  return sanitizeHost(input)
}
