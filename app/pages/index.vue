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

import ChartSettingsBar from '~/components/layout/ChartSettingsBar.vue'
import ContainersPanel from '~/components/blocks/ContainersPanel.vue'
import HealthOverview from '~/components/blocks/HealthOverview.vue'
import RequestsChart from '~/components/blocks/RequestsChart.vue'
import ServerStats from '~/components/blocks/ServerStats.vue'
import SystemInfo from '~/components/blocks/SystemInfo.vue'

definePageMeta({ layout: 'default' })
useHead({ title: 'LiveDock · Dashboard' })
</script>

<template>
  <div class="dashboard">
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
}
</style>
