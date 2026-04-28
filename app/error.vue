<script setup lang="ts">
// Custom error page (404, 500, etc).
import BaseButton from '~/components/ui/BaseButton.vue'
import Logo from '~/components/common/Logo.vue'

interface NuxtError {
  statusCode: number
  statusMessage?: string
  message?: string
}
defineProps<{ error: NuxtError }>()

function home() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <main class="error">
    <Logo :size="48" with-text />
    <h1 class="error__code">{{ error.statusCode }}</h1>
    <p class="error__msg">{{ error.statusMessage || error.message || 'Something went wrong.' }}</p>
    <BaseButton variant="gradient" @click="home">Back to dashboard</BaseButton>
  </main>
</template>

<style lang="scss" scoped>
.error {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  background: var(--color-background);
  color: var(--color-foreground);
  padding: var(--space-6);

  &__code {
    font-size: 4rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    background: linear-gradient(135deg, var(--color-brand-from), var(--color-brand-to));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  &__msg {
    color: var(--color-muted-foreground);
    text-align: center;
    max-width: 40ch;
  }
}
</style>
