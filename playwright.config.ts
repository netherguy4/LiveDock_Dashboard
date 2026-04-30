import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from '@playwright/test'

// Load .env so LOGIN / PASSWORD / SESSION_SECRET reach both Playwright
// (for credentials in tests) and the spawned `yarn dev` (for /api/login).
try {
  const raw = readFileSync(resolve(import.meta.dirname, '.env'), 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i)
    if (!m) continue
    const [, key, val] = m
    if (process.env[key] !== undefined) continue
    process.env[key] = val.replace(/^['"]|['"]$/g, '')
  }
} catch { /* .env is optional */ }

const PORT = Number(process.env.E2E_PORT ?? 3000)
const HOST = process.env.E2E_HOST ?? '127.0.0.1'
const baseURL = process.env.E2E_BASE_URL ?? `http://${HOST}:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `yarn dev --port ${PORT} --host ${HOST}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 180_000,
  },
})
