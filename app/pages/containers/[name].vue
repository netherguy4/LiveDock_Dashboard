<script setup lang="ts">
import { Terminal } from 'lucide-vue-next'
import ContainerDetail from '~/components/blocks/ContainerDetail.vue'
import LogsPanel from '~/components/blocks/LogsPanel.vue'
import { useContainersStore } from '~/stores/containers.store'

const containers = useContainersStore()

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
    <div class="cont-page" :aria-busy="containers.loading ? true : undefined">
      <ContainerDetail :name="name" />

      <section class="cont-page__logs">
        <header class="cont-page__logs-head">
          <div class="cont-page__logs-title">
            <Terminal :size="18" />
            <span>Container logs</span>
            <span class="cont-page__logs-name">{{ name }}</span>
          </div>
        </header>
        <div class="cont-page__logs-body">
          <LogsPanel :container-name="name" />
        </div>
      </section>
    </div>
    <template #fallback>
      <div class="cont-page" :aria-busy="containers.loading ? true : undefined">
        <div class="cont-page__skeleton" aria-hidden="true">
          <div class="cont-page__sk-head">
            <div class="cont-page__sk-back" />
            <div class="cont-page__sk-avatar" />
            <div class="cont-page__sk-title-group">
              <div class="cont-page__sk-title-row">
                <div class="cont-page__sk-title" />
                <div class="cont-page__sk-badge" />
              </div>
              <div class="cont-page__sk-sub" />
            </div>
            <div class="cont-page__sk-head-actions">
              <div class="cont-page__sk-act-btn" />
              <div class="cont-page__sk-act-btn cont-page__sk-act-btn--sm" />
            </div>
          </div>
          <div class="cont-page__sk-grid">
            <div v-for="i in 4" :key="i" class="cont-page__sk-stat">
              <div class="cont-page__sk-stat-head">
                <div class="cont-page__sk-stat-ico" />
                <div class="cont-page__sk-stat-label" />
              </div>
              <div class="cont-page__sk-stat-value" />
              <div class="cont-page__sk-stat-sub" />
              <div class="cont-page__sk-stat-spark" />
            </div>
          </div>
        </div>
        <section class="cont-page__logs">
          <header class="cont-page__logs-head">
            <div class="cont-page__logs-title">
              <div class="cont-page__sk-ico-sm" />
              <div class="cont-page__sk-text" style="width: 100px" />
              <div class="cont-page__sk-text" style="width: 80px" />
            </div>
          </header>
          <div class="cont-page__logs-body">
            <div v-for="i in 6" :key="i" class="cont-page__sk-log-line" />
          </div>
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
  &__sk-back {
    @include skeleton(40px, 40px);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }
  &__sk-avatar {
    @include skeleton(40px, 40px);
    border-radius: var(--radius-lg);
  }
  &__sk-title-group {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  &__sk-title-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  &__sk-title {
    @include skeleton(22px, 180px);
    border-radius: var(--radius-md);
  }
  &__sk-badge {
    @include skeleton(20px, 56px);
    border-radius: var(--radius-md);
  }
  &__sk-sub {
    @include skeleton(12px, 260px);
    border-radius: var(--radius-md);
    margin-top: var(--space-1);
  }
  &__sk-head-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    margin-left: auto;
    flex-shrink: 0;
  }
  &__sk-act-btn {
    @include skeleton(32px, 90px);
    border-radius: var(--radius-md);
  }
  &__sk-act-btn--sm {
    width: 72px;
  }
  &__sk-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-4);
    @include from($bp-sm) { grid-template-columns: repeat(2, 1fr); }
    @include from($bp-lg) { grid-template-columns: repeat(4, 1fr); }
  }
  &__sk-stat {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  &__sk-stat-head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-1);
  }
  &__sk-stat-ico {
    @include skeleton(36px, 36px);
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }
  &__sk-stat-label {
    @include skeleton(13px, 64px);
    border-radius: var(--radius-sm);
  }
  &__sk-stat-value {
    @include skeleton(28px, 120px);
    border-radius: var(--radius-md);
  }
  &__sk-stat-sub {
    @include skeleton(12px, 80px);
    border-radius: var(--radius-sm);
  }
  &__sk-stat-spark {
    @include skeleton(56px, 100%);
    border-radius: var(--radius-sm);
    margin-top: auto;
  }

  // Skeleton utilities shared by header and logs
  &__sk-ico-sm {
    @include skeleton(18px, 18px);
    border-radius: var(--radius-sm);
  }
  &__sk-text {
    @include skeleton(16px, 100%);
    border-radius: var(--radius-md);
  }

  &__sk-log-line {
    @include skeleton(12px, 100%);
    border-radius: var(--radius-sm);
    margin-bottom: var(--space-2);

    &:nth-child(odd) { width: 65%; }
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
    padding: var(--space-3) var(--space-5);
    border-bottom: 1px solid var(--color-divider);
  }
  &__logs-title {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    color: var(--color-foreground);
    font-size: var(--fs-h3);
    font-weight: var(--fw-bold);

    .lucide { color: var(--color-muted-foreground); }
  }
  &__logs-name {
    font-family: $font-stack-mono;
    font-size: var(--fs-small);
    color: var(--color-subtle-foreground);
    font-weight: var(--fw-medium);
  }
  &__logs-body {
    background: var(--color-background);
    height: 480px;
    padding: var(--space-4) var(--space-5);
  }
}
</style>
