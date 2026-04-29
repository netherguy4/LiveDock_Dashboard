<script setup lang="ts">
import { Plus, Server } from 'lucide-vue-next'
import ChartSettingsBar from '~/components/layout/ChartSettingsBar.vue'
import ContainersPanel from '~/components/blocks/ContainersPanel.vue'
import HealthOverview from '~/components/blocks/HealthOverview.vue'
import RequestsChart from '~/components/blocks/RequestsChart.vue'
import ServerStats from '~/components/blocks/ServerStats.vue'
import SystemInfo from '~/components/blocks/SystemInfo.vue'
import { useHostsStore } from '~/stores/hosts.store'
import { useUiStore } from '~/stores/ui.store'

const hosts = useHostsStore()
const ui = useUiStore()

definePageMeta({ layout: 'default' })
useHead({ title: 'LiveDock · Dashboard' })
</script>

<template>
  <div class="dashboard">
    <template v-if="!ui.booted">
      <div class="dashboard__skeleton">
        <div class="dashboard__skeleton-row">
          <div class="dashboard__skeleton-block" style="height: 56px" />
          <div class="dashboard__skeleton-block" style="width: 200px; height: 36px" />
        </div>
        <div class="dashboard__skeleton-row">
          <div class="dashboard__skeleton-block" style="height: 40px; flex: 1" />
          <div class="dashboard__skeleton-block" style="width: 180px; height: 40px" />
        </div>
        <div class="dashboard__skeleton-grid">
          <div class="dashboard__skeleton-block" style="height: 152px" />
          <div class="dashboard__skeleton-block" style="height: 152px" />
          <div class="dashboard__skeleton-block" style="height: 152px" />
          <div class="dashboard__skeleton-block" style="height: 152px" />
        </div>
        <div class="dashboard__skeleton-row">
          <div class="dashboard__skeleton-block" style="flex: 2; height: 240px" />
          <div class="dashboard__skeleton-block" style="flex: 1; height: 240px" />
        </div>
      </div>
    </template>
    <template v-else-if="hosts.isEmpty && !hosts.loading">
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

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    width: 100%;
  }
  &__skeleton-row {
    display: flex;
    gap: var(--space-4);
    align-items: center;
  }
  &__skeleton-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);

    @include until($bp-md) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 480px) { grid-template-columns: 1fr; }
  }
  &__skeleton-block {
    @include skeleton;
    border-radius: var(--radius-lg);
    min-width: 0;
  }

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
    background: linear-gradient(135deg, var(--emerald-500), var(--teal-500) 50%, var(--cyan-600));
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
