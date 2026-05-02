# LiveDock Dashboard

LiveDock is a self-hosted monitoring dashboard for servers, containers, and request activity. It is designed for people who want a fast, calm view of what their system is doing without digging through dashboards or logs.

The dashboard pairs with the LiveDock API service that collects and serves the data.

[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)](https://nuxt.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## Demo

Open the live demo: [homepage-opal-pi.vercel.app](https://homepage-opal-pi.vercel.app)

The demo is useful for checking the dashboard flow before wiring LiveDock to your own host and API service.

## What it shows

- Host and container status at a glance
- CPU, memory, disk, and network activity
- Request throughput and history
- Container history, logs, and actions
- SSR-first rendering with a responsive UI for desktop and mobile

## Stack

- Nuxt 4
- Vue 3
- TypeScript
- Pinia
- Chart.js for metrics visualization
- Vercel-compatible deployment

## Getting started

```bash
pnpm install
pnpm dev
```

The app expects Node.js 22 or newer.

## Scripts

- `pnpm dev` - start the development server
- `pnpm build` - build for production
- `pnpm preview` - preview the production build
- `pnpm lint` - run ESLint
- `pnpm lint:fix` - run ESLint with autofix
- `pnpm lint:style` - run Stylelint over SCSS
- `pnpm test:unit` - run Vitest
- `pnpm test:e2e` - run Playwright tests

## Environment

Copy `.env.example` and fill in the values for your deployment.

- `LOGIN` - login name for the dashboard
- `PASSWORD` - dashboard password
- `SESSION_SECRET` - HMAC secret for session cookies
- `DATABASE_URL`, `POSTGRES_URL`, `DATABASE_POSTGRES_URL`, `DATABASE_POSTGRES_PRISMA_URL`, `DATABASE_POSTGRES_URL_NON_POOLING` - optional Postgres connection sources
- `SQLITE_PATH` - optional SQLite path for self-hosted deployment
- `NITRO_PRESET` - deployment preset, `vercel` by default

## Repository layout

- `app/` - Nuxt app code
- `public/` - static assets and favicon set
- `server/` - server-side logic
- `tests/` - automated tests

## Related service

- [`LiveDock_API`](https://github.com/netherg-io/LiveDock_API) - backend collector and API for snapshots, history, logs, and control

## License

MIT
