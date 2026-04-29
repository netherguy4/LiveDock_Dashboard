<script setup lang="ts">
import ContainersPanel from '~/components/blocks/ContainersPanel.vue'
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
useHead({ title: 'LiveDock · Containers' })
</script>

<template>
  <div class="containers-page" :aria-busy="containers.loading ? true : undefined">
    <header class="containers-page__head">
      <h1>Containers</h1>
      <p>Search, filter, sort, and control your Docker containers.</p>
    </header>
    <ClientOnly>
      <ContainersPanel />
      <template #fallback>
        <div class="containers-page__skeleton" aria-hidden="true">
          <div class="containers-page__sk-head">
            <div class="containers-page__sk-ico" />
            <div class="containers-page__sk-hdr-bar" style="width: 100px" />
            <div class="containers-page__sk-hdr-badge" />
            <div class="containers-page__sk-hdr-btn" />
          </div>
          <div class="containers-page__sk-filters">
            <div class="containers-page__sk-search" />
            <div class="containers-page__sk-chips">
              <div class="containers-page__sk-chip" />
              <div class="containers-page__sk-chip" />
              <div class="containers-page__sk-chip" />
              <div class="containers-page__sk-chip" />
            </div>
          </div>
          <div class="containers-page__sk-sort">
            <div class="containers-page__sk-sort-bar" style="width: 48px" />
            <div class="containers-page__sk-sort-bar" style="width: 40px" />
            <div class="containers-page__sk-sort-bar" style="width: 24px" />
            <div class="containers-page__sk-sort-bar" style="width: 36px" />
            <div class="containers-page__sk-sort-bar" style="width: 28px" />
            <div class="containers-page__sk-sort-bar" style="width: 36px; margin-left: auto" />
          </div>
          <div v-for="i in 5" :key="i" class="containers-page__sk-row">
            <div class="containers-page__sk-name">
              <div class="containers-page__sk-dot" />
              <div class="containers-page__sk-name-stack">
                <div class="containers-page__sk-name-bar" />
                <div class="containers-page__sk-image-bar" />
              </div>
            </div>
            <div class="containers-page__sk-pill" />
            <div class="containers-page__sk-num" />
            <div class="containers-page__sk-num" />
            <div class="containers-page__sk-port" />
            <div class="containers-page__sk-actions">
              <div class="containers-page__sk-btn" />
              <div class="containers-page__sk-btn" />
            </div>
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

  // Panel header
  &__sk-head {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-divider);
  }
  &__sk-ico {
    @include skeleton(20px, 20px);
    border-radius: var(--radius-sm);
  }
  &__sk-hdr-bar {
    @include skeleton(16px, 100%);
    border-radius: var(--radius-md);
  }
  &__sk-hdr-badge {
    @include skeleton(20px, 56px);
    border-radius: var(--radius-md);
    margin-left: auto;
  }
  &__sk-hdr-btn {
    @include skeleton(20px, 72px);
    border-radius: var(--radius-md);
  }

  // Search / filters bar
  &__sk-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-5);
    background: var(--color-card-subtle);
    border-bottom: 1px solid var(--color-divider);
  }
  &__sk-search {
    @include skeleton(36px, 220px);
    border-radius: var(--radius-md);
  }
  &__sk-chips {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  &__sk-chip {
    @include skeleton(32px, 64px);
    border-radius: 999px;
  }

  // Sort header
  &__sk-sort {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 2fr) minmax(0, 2fr) minmax(0, 2fr) 80px 100px;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    background: var(--color-row-header);
    border-bottom: 1px solid var(--color-divider);
    align-items: center;
  }
  &__sk-sort-bar {
    @include skeleton(10px, 100%);
    border-radius: var(--radius-sm);
  }

  // Data rows with content-shaped cells
  &__sk-row {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 2fr) minmax(0, 2fr) minmax(0, 2fr) 80px 100px;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--color-divider);
    align-items: center;
  }

  // Name column: circle + two-line stack
  &__sk-name {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }
  &__sk-dot {
    @include skeleton(10px, 10px);
    border-radius: 50%;
    flex-shrink: 0;
  }
  &__sk-name-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }
  &__sk-name-bar {
    @include skeleton(13px, 120px);
  }
  &__sk-image-bar {
    @include skeleton(12px, 90px);
  }

  // Status: pill shape
  &__sk-pill {
    @include skeleton(20px, 64px);
    border-radius: var(--radius-md);
  }

  // CPU / Memory: narrow mono hint
  &__sk-num {
    @include skeleton(13px, 48px);
  }

  // Port
  &__sk-port {
    @include skeleton(13px, 32px);
  }

  // Actions: small squares
  &__sk-actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-1);
  }
  &__sk-btn {
    @include skeleton(32px, 32px);
    border-radius: var(--radius-sm);
  }
}
</style>
