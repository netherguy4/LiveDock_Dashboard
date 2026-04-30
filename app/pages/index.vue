<script setup lang="ts">
import { Plus, Server, Users } from 'lucide-vue-next'
import ChartSettingsBar from '~/components/layout/ChartSettingsBar.vue'
import ContainersPanel from '~/components/blocks/ContainersPanel.vue'
import HealthOverview from '~/components/blocks/HealthOverview.vue'
import RequestsChart from '~/components/blocks/RequestsChart.vue'
import ServerStats from '~/components/blocks/ServerStats.vue'
import SystemInfo from '~/components/blocks/SystemInfo.vue'
import { useHostsStore } from '~/stores/hosts.store'
import { useAuthStore } from '~/stores/auth.store'
import { useUiStore } from '~/stores/ui.store'

const hosts = useHostsStore()
const auth = useAuthStore()
const ui = useUiStore()

definePageMeta({ layout: 'default' })
useHead({ title: 'LiveDock · Dashboard' })
</script>

<template>
  <div class="dashboard" :aria-busy="!ui.booted ? true : undefined">
    <template v-if="!ui.booted">
      <div class="dashboard__skeleton" aria-hidden="true">
        <div class="dashboard__sk-top">
          <div class="dashboard__sk-system-info">
            <div class="dashboard__sk-host-bar" />
            <div class="dashboard__sk-uptime" />
            <div class="dashboard__sk-chip-row">
              <div class="dashboard__sk-chip" />
              <div class="dashboard__sk-chip" />
              <div class="dashboard__sk-chip" />
            </div>
          </div>
        </div>
        <div class="dashboard__sk-bar">
          <div class="dashboard__sk-bar-item" />
          <div class="dashboard__sk-bar-item" style="width: 80px" />
        </div>
        <div class="dashboard__sk-grid">
          <div v-for="i in 4" :key="i" class="dashboard__sk-stat">
            <div class="dashboard__sk-stat-head">
              <div class="dashboard__sk-stat-ico" />
              <div class="dashboard__sk-stat-label" />
            </div>
            <div class="dashboard__sk-stat-value" />
            <div class="dashboard__sk-stat-sub" />
            <div class="dashboard__sk-stat-spark" />
          </div>
        </div>
        <div class="dashboard__sk-section">
          <div class="dashboard__sk-core">
            <div class="dashboard__sk-core-head">
              <div class="dashboard__sk-core-title" />
            </div>
            <div class="dashboard__sk-core-list">
              <div v-for="i in 3" :key="i" class="dashboard__sk-core-row">
                <div class="dashboard__sk-core-name" />
                <div class="dashboard__sk-core-pct" />
                <div class="dashboard__sk-core-track" />
              </div>
            </div>
          </div>
          <div class="dashboard__sk-disk">
            <div class="dashboard__sk-disk-head">
              <div class="dashboard__sk-disk-title" />
            </div>
            <div class="dashboard__sk-disk-list">
              <div v-for="i in 3" :key="i" class="dashboard__sk-disk-row">
                <div class="dashboard__sk-disk-device" />
                <div class="dashboard__sk-disk-mount" />
                <div class="dashboard__sk-disk-track" />
                <div class="dashboard__sk-disk-pct" />
                <div class="dashboard__sk-disk-size" />
              </div>
            </div>
          </div>
        </div>
        <div class="dashboard__sk-throughput">
          <div class="dashboard__sk-throughput-main">
            <div class="dashboard__sk-card-head">
              <div class="dashboard__sk-card-title" />
            </div>
            <div class="dashboard__sk-chart-area" />
          </div>
          <div class="dashboard__sk-throughput-side">
            <div class="dashboard__sk-health-block" />
            <div class="dashboard__sk-health-block" />
            <div class="dashboard__sk-health-block" />
          </div>
        </div>
        <div class="dashboard__sk-panel">
          <div class="dashboard__sk-panel-head">
            <div class="dashboard__sk-ico" />
            <div class="dashboard__sk-panel-title" />
          </div>
          <div class="dashboard__sk-panel-row">
            <div class="dashboard__sk-panel-col" style="width: 160px" />
            <div class="dashboard__sk-panel-col" style="width: 100px" />
            <div class="dashboard__sk-panel-col" style="width: 48px" />
            <div class="dashboard__sk-panel-col" style="width: 48px" />
          </div>
          <div v-for="i in 4" :key="i" class="dashboard__sk-panel-row">
            <div class="dashboard__sk-panel-name">
              <div class="dashboard__sk-dot" />
              <div class="dashboard__sk-name-stack">
                <div class="dashboard__sk-panel-name-bar" />
                <div class="dashboard__sk-panel-image-bar" />
              </div>
            </div>
            <div class="dashboard__sk-pill" />
            <div class="dashboard__sk-panel-num" />
            <div class="dashboard__sk-panel-num" />
          </div>
        </div>
      </div>
    </template>
    <template v-else-if="auth.kind === 'admin'">
      <div class="dashboard__empty">
        <div class="dashboard__empty-icon">
          <Users :size="48" />
        </div>
        <h2 class="dashboard__empty-title">Управление пользователями</h2>
        <p class="dashboard__empty-desc">
          Создайте пользователя, чтобы выдать ему отдельный список серверов
        </p>
        <NuxtLink class="dashboard__empty-action" to="/users">
          <Users :size="18" />
          Открыть пользователей
        </NuxtLink>
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

  // SystemInfo-like top row
  &__sk-top {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-5);
  }
  &__sk-system-info {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
  }
  &__sk-host-bar {
    @include skeleton(20px, 240px);
    border-radius: var(--radius-md);
  }
  &__sk-uptime {
    @include skeleton(18px, 100px);
    border-radius: var(--radius-md);
    margin-left: auto;
  }
  &__sk-chip-row {
    display: flex;
    gap: var(--space-2);
  }
  &__sk-chip {
    @include skeleton(32px, 56px);
    border-radius: 999px;
  }

  // ChartSettingsBar-like row
  &__sk-bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  &__sk-bar-item {
    @include skeleton(36px, 120px);
    border-radius: var(--radius-md);
  }

  // 4 StatCard-like blocks
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
    @include skeleton(20px, 64px);
    border-radius: var(--radius-sm);
  }
  &__sk-stat-value {
    @include skeleton(31px, 120px);
    border-radius: var(--radius-md);
  }
  &__sk-stat-sub {
    @include skeleton(17px, 80px);
    border-radius: var(--radius-sm);
  }
  &__sk-stat-spark {
    @include skeleton(56px, 100%);
    border-radius: var(--radius-sm);
    margin-top: auto;
  }

  // Core + Disk section (mirrors ServerStats)
  &__sk-section {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-4);
    @include from($bp-md) { grid-template-columns: 1fr 1fr; }
  }
  &__sk-core,
  &__sk-disk {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-5);
  }
  &__sk-core-head,
  &__sk-disk-head {
    margin-bottom: var(--space-4);
  }
  &__sk-core-title,
  &__sk-disk-title {
    @include skeleton(14px, 72px);
    border-radius: var(--radius-md);
  }
  &__sk-core-list,
  &__sk-disk-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  &__sk-core-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  &__sk-core-name {
    @include skeleton(11px, 48px);
  }
  &__sk-core-pct {
    @include skeleton(12px, 32px);
  }
  &__sk-core-track {
    @include skeleton(6px, 100%);
    border-radius: 999px;
  }
  &__sk-disk-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  &__sk-disk-device {
    @include skeleton(14px, 90px);
  }
  &__sk-disk-mount {
    @include skeleton(14px, 60px);
  }
  &__sk-disk-track {
    @include skeleton(6px, 100%);
    border-radius: 999px;
  }
  &__sk-disk-pct {
    @include skeleton(14px, 32px);
  }
  &__sk-disk-size {
    @include skeleton(14px, 48px);
  }

  // Throughput chart + health
  &__sk-throughput {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-5);

    @include from($bp-lg) { grid-template-columns: 2fr 1fr; }
  }
  &__sk-throughput-main {
    min-width: 0;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-5);
  }
  &__sk-throughput-side {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  &__sk-card-head {
    margin-bottom: var(--space-4);
  }
  &__sk-card-title {
    @include skeleton(14px, 160px);
    border-radius: var(--radius-md);
  }
  &__sk-chart-area {
    @include skeleton(180px, 100%);
    border-radius: var(--radius-lg);
  }
  &__sk-health-block {
    @include skeleton(72px, 100%);
    border-radius: var(--radius-xl);
  }

  // ContainersPanel-like block
  &__sk-panel {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }
  &__sk-panel-head {
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
  &__sk-panel-title {
    @include skeleton(16px, 100px);
    border-radius: var(--radius-md);
  }
  &__sk-panel-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    border-top: 1px solid var(--color-divider);
    background: var(--color-row-header);
    min-height: 36px;

    &:nth-child(n+3) {
      background: transparent;
      padding: var(--space-3) var(--space-4);
    }
  }
  &__sk-panel-col {
    @include skeleton(10px, 100%);
    border-radius: var(--radius-sm);
  }
  &__sk-panel-name {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
    flex: 1;
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
  &__sk-panel-name-bar {
    @include skeleton(13px, 120px);
  }
  &__sk-panel-image-bar {
    @include skeleton(12px, 90px);
  }
  &__sk-pill {
    @include skeleton(20px, 64px);
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }
  &__sk-panel-num {
    @include skeleton(13px, 48px);
    flex-shrink: 0;
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
