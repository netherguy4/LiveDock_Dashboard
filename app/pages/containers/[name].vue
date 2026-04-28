<script setup lang="ts">
// Container detail page. The drawer-based logs from the dashboard get a
// dedicated full-page surface here, locked to this container.

import { Terminal } from 'lucide-vue-next'
import BaseBadge from '~/components/ui/BaseBadge.vue'
import ContainerDetail from '~/components/blocks/ContainerDetail.vue'
import LogsPanel from '~/components/blocks/LogsPanel.vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const name = computed(() => decodeURIComponent(String(route.params.name)))

useHead(() => ({ title: `LiveDock · ${name.value}` }))
</script>

<template>
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
</template>

<style lang="scss" scoped>
.cont-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

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
