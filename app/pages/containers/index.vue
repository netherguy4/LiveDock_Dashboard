<script setup lang="ts">
import ContainersPanel from '~/components/blocks/ContainersPanel.vue'

definePageMeta({
  layout: 'default',
  middleware: [
    () => {
      const hosts = useHostsStore()
      if (hosts.isEmpty) return navigateTo('/')
    },
  ],
})
useHead({ title: 'LiveDock · Containers' })
</script>

<template>
  <div class="containers-page">
    <header class="containers-page__head">
      <h1>Containers</h1>
      <p>Search, filter, sort, and control your Docker containers.</p>
    </header>
    <ClientOnly>
      <ContainersPanel />
      <template #fallback>
        <div class="containers-page__skeleton">
          <div v-for="i in 5" :key="i" class="containers-page__skeleton-row">
            <div class="containers-page__sk-col containers-page__sk-col--lg" />
            <div class="containers-page__sk-col containers-page__sk-col--md" />
            <div class="containers-page__sk-col containers-page__sk-col--sm" />
            <div class="containers-page__sk-col containers-page__sk-col--sm" />
            <div class="containers-page__sk-col containers-page__sk-col--xs" />
            <div class="containers-page__sk-col containers-page__sk-col--act" />
          </div>
        </div>
      </template>
    </ClientOnly>
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
      font-size: var(--fs-h1);
      font-weight: var(--fw-extrabold);
      letter-spacing: -0.02em;
      color: var(--color-foreground);
    }
    p {
      margin: var(--space-1) 0 0;
      color: var(--color-muted-foreground);
      font-size: var(--fs-body);
    }
  }

  &__skeleton {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }
  &__skeleton-row {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 2fr) minmax(0, 2fr) minmax(0, 2fr) 80px 100px;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--color-divider);
    align-items: center;

    &:first-child { border-top: 0; }
  }
  &__sk-col {
    @include skeleton(14px, 100%);
    &--lg  { max-width: 180px; }
    &--md  { max-width: 80px; }
    &--sm  { max-width: 60px; }
    &--xs  { max-width: 40px; }
    &--act { max-width: 80px; margin-left: auto; }
  }
}
</style>
