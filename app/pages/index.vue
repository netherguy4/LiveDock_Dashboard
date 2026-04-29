<script setup lang="ts">
// Main dashboard. Composes blocks; data flows from Pinia stores; polling
// is driven globally from app.vue, so this page just renders.
//
// Layout matches new_frontend HomePage exactly:
//   1. SystemInfo
//   2. ChartSettingsBar (refresh / pause / show-all toggles)
//   3. ServerStats (4 stat cards + optional per-core / per-volume panels)
//   4. 3-col row: RequestsChart (lg col-span 2) + HealthOverview (1)
//   5. ContainersPanel

import { Plus, Server } from 'lucide-vue-next'
import ChartSettingsBar from '~/components/layout/ChartSettingsBar.vue'
import ContainersPanel from '~/components/blocks/ContainersPanel.vue'
import HealthOverview from '~/components/blocks/HealthOverview.vue'
import RequestsChart from '~/components/blocks/RequestsChart.vue'
import ServerStats from '~/components/blocks/ServerStats.vue'
import SystemInfo from '~/components/blocks/SystemInfo.vue'
import { useHostsStore } from '~/stores/hosts.store'

const hosts = useHostsStore()

definePageMeta({ layout: 'default' })
useHead({ title: 'LiveDock · Dashboard' })
</script>

<template>
  <div class="dashboard">
    <template v-if="hosts.isEmpty && !hosts.loading">
      <div class="dashboard__empty">
        <div class="dashboard__empty-icon">
          <Server :size="48" />
        </div>
        <h2 class="dashboard__empty-title">Добавить первый сервер</h2>
        <p class="dashboard__empty-desc">
          Подключите Docker-сервер для начала мониторинга
        </p>
        <button
          class="dashboard__empty-action"
          @click="hosts.setAddDialogOpen(true)"
        >
          <Plus :size="18" />
          Добавить сервер
        </button>
      </div>
    </template>
    <template v-else>
      <SystemInfo />
      <ChartSettingsBar />
      <ServerStats />

      <div class="dashboard__throughput">
        <div class="dashboard__throughput-main">
          <RequestsChart />
        </div>
        <div class="dashboard__throughput-side">
          <HealthOverview />
        </div>
      </div>

      <ContainersPanel />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  &__throughput {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-5);

    @include from($bp-lg) { grid-template-columns: 2fr 1fr; }
  }
  &__throughput-main, &__throughput-side {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-10) var(--space-4);
    min-height: 60vh;
    gap: var(--space-4);
  }
  &__empty-icon {
    width: 88px;
    height: 88px;
    border-radius: var(--radius-xl);
    background: var(--color-muted);
    color: var(--color-muted-foreground);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-2);
  }
  &__empty-title {
    font-size: var(--fs-h2);
    font-weight: var(--fw-bold);
    color: var(--color-foreground);
    margin: 0;
  }
  &__empty-desc {
    font-size: var(--fs-body);
    color: var(--color-subtle-foreground);
    max-width: 340px;
    line-height: 1.5;
    margin: 0;
  }
  &__empty-action {
    margin-top: var(--space-3);
    height: 44px;
    padding: 0 var(--space-6);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    border: 0;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, var(--emerald-500), var(--cyan-600));
    color: #ffffff;
    font-size: var(--fs-h3);
    font-weight: var(--fw-semibold);
    cursor: pointer;
    box-shadow: 0 8px 24px -10px rgba(16, 185, 129, 0.45);
    transition: opacity $transition-fast;
    text-decoration: none;

    &:hover { opacity: 0.92; }
    &:focus-visible {
      outline: 2px solid var(--color-ring);
      outline-offset: 3px;
    }
  }
}
</style>
