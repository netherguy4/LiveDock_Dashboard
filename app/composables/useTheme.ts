// Theme switcher backed by VueUse `useColorMode`. We attach the class
// `theme--dark` to <html> ourselves (instead of letting useColorMode use its
// default `dark` class) so the SCSS selector matches the design tokens.

import { useColorMode } from '@vueuse/core'
import { STORAGE_KEYS } from '~/constants/storage-keys'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const useTheme = () => {
  const mode = useColorMode<ThemeMode>({
    storageKey: STORAGE_KEYS.THEME,
    selector: 'html',
    attribute: 'class',
    modes: {
      light: 'theme--light',
      dark: 'theme--dark',
    },
    initialValue: 'dark',
  })

  const isDark = computed(() => {
    if (mode.value === 'dark') return true
    if (mode.value === 'light') return false
    return import.meta.client && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const toggle = () => {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  return { mode, isDark, toggle }
}
