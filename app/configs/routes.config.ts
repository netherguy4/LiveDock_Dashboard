// Single source of truth for navigable routes — used by sidebar nav and
// guards. Keep paths in sync with files in /app/pages/**.

export const ROUTES = {
  HOME: '/',
  CONTAINERS: '/containers',
  CONTAINER: (name: string) => `/containers/${encodeURIComponent(name)}`,
  USERS: '/users',
  LOGIN: '/login',
} as const

export const NAV_ITEMS = [
  { label: 'Dashboard', to: ROUTES.HOME, icon: 'LayoutDashboard' },
  { label: 'Containers', to: ROUTES.CONTAINERS, icon: 'Boxes' },
] as const
