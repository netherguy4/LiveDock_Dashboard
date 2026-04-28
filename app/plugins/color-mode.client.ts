// Initialize color mode on every page so the theme class is always applied,
// even on pages/auth layouts that don't render ThemeToggle or AppHeader.
export default defineNuxtPlugin(() => {
  useTheme()
})
