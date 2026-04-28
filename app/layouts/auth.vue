<script setup lang="ts">
// Centered layout for /login. The login page provides its own background
// (interactive grid overlay), so we keep this layout intentionally empty.
</script>

<template>
  <main class="auth-layout">
    <slot />
  </main>
</template>

<style lang="scss" scoped>
.auth-layout {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  position: relative;
  overflow: hidden;
}
</style>
