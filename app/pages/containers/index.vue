<script setup lang="ts">
// Containers-only page — same panel as on the dashboard but full-width.
import ContainersPanel from '~/components/blocks/ContainersPanel.vue'

definePageMeta({ layout: 'default' })
useHead({ title: 'LiveDock · Containers' })
</script>

<template>
  <div class="containers-page">
    <header class="containers-page__head">
      <h1>Containers</h1>
      <p>Search, filter, sort, and control your Docker containers.</p>
    </header>
    <ContainersPanel />
  </div>
</template>

<style lang="scss" scoped>
.containers-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  &__head {
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--color-foreground);
    }
    p {
      margin: 4px 0 0;
      color: var(--color-muted-foreground);
      font-size: 13px;
    }
  }
}
</style>
