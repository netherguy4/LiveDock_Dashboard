<script setup lang="ts">
import { Terminal } from 'lucide-vue-next'
import BaseBadge from '~/components/ui/BaseBadge.vue'
import ContainerDetail from '~/components/blocks/ContainerDetail.vue'
import LogsPanel from '~/components/blocks/LogsPanel.vue'

definePageMeta({
  layout: 'default',
  middleware: [
    () => {
      const hosts = useHostsStore()
      if (hosts.isEmpty) return navigateTo('/')
    },
  ],
})

const route = useRoute()
const name = computed(() => decodeURIComponent(String(route.params.name)))

useHead(() => ({ title: `LiveDock · ${name.value}` }))
</script>

<template>
  <ClientOnly>
    <div class="cont-page">
      <ContainerDetail :name="name" />

      <section class="cont-page__logs">
        <header class="cont-page__logs-head">
          <div class="cont-page__logs-title">
            <Terminal :size="18" />
            <span>Container logs</span>
            <BaseBadge tone="success">
              <span class="cont-page__logs-pulse" /> streaming
            </BaseBadge>
            <span class="cont-page__logs-name">{{ name }}</span>
          </div>
          <div class="cont-page__logs-levels">
            <BaseBadge>INFO</BaseBadge>
            <BaseBadge tone="warn">WARN</BaseBadge>
            <BaseBadge tone="danger">ERROR</BaseBadge>
          </div>
        </header>
        <div class="cont-page__logs-body">
          <LogsPanel :container-name="name" />
        </div>
      </section>
    </div>
    <template #fallback>
      <div class="cont-page">
        <div class="cont-page__skeleton">
          <div class="cont-page__sk-head">
            <div class="cont-page__sk-avatar" />
            <div>
              <div class="cont-page__sk-line cont-page__sk-line--title" />
              <div class="cont-page__sk-line cont-page__sk-line--sub" />
            </div>
          </div>
          <div class="cont-page__sk-grid">
            <div v-for="i in 4" :key="i" class="cont-page__sk-card" />
          </div>
        </div>
        <section class="cont-page__logs">
          <header class="cont-page__logs-head">
            <div class="cont-page__logs-title">
              <div class="cont-page__sk-line cont-page__sk-line--sm" style="width: 100px" />
            </div>
          </header>
          <div class="cont-page__logs-body" />
        </section>
      </div>
    </template>
  </ClientOnly>
</template>

<style lang="scss" scoped>
.cont-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }
  &__sk-head {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  &__sk-avatar {
    @include skeleton(40px, 40px);
    border-radius: var(--radius-lg);
  }
  &__sk-line {
    @include skeleton(12px, 100%);
    border-radius: var(--radius-md);
    &--title { width: 180px; height: 22px; }
    &--sub { width: 260px; margin-top: var(--space-1); }
  }
  &__sk-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
    @include until($bp-md) { grid-template-columns: repeat(2, 1fr); }
  }
  &__sk-card {
    @include skeleton(152px, 100%);
    border-radius: var(--radius-xl);
  }

  &__logs {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }
  &__logs-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-divider);
  }
  &__logs-title {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    color: var(--color-foreground);
    font-size: 16px;
    font-weight: 700;

    .lucide { color: var(--color-muted-foreground); }
  }
  &__logs-pulse {
    display: inline-block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--emerald-500);
  }
  &__logs-name {
    font-family: $font-stack-mono;
    font-size: 12px;
    color: var(--color-subtle-foreground);
    font-weight: 400;
  }
  &__logs-levels {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  &__logs-body {
    background: var(--slate-950);
    height: 480px;
    padding: var(--space-4) var(--space-5);
  }
}
</style>
