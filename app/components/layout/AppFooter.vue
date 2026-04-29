<script setup lang="ts">
import { Pause } from 'lucide-vue-next'
import { useTimeAgo } from '@vueuse/core'
import { useHostsStore } from '~/stores/hosts.store'
import { useMetricsStore } from '~/stores/metrics.store'
import { useUiStore } from '~/stores/ui.store'

const hosts = useHostsStore()
const metrics = useMetricsStore()
const ui = useUiStore()

const timeAgo = useTimeAgo(() => metrics.lastUpdated || Date.now())
const ready = computed(() => metrics.lastUpdated > 0)

const statusVariant = computed(() => {
  const s = hosts.active?.status
  if (s === 'online') return 'success'
  if (s === 'degraded') return 'warn'
  return 'neutral'
})
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__left">
      <span
        class="app-footer__dot"
        :class="`app-footer__dot--${statusVariant}`"
        :aria-label="hosts.active?.status ?? 'offline'"
        aria-hidden="false"
      />
      <span class="app-footer__host">{{ hosts.active?.name ?? 'No host' }}</span>
    </div>

    <div class="app-footer__right">
      <template v-if="ui.paused">
        <Pause :size="11" class="app-footer__pause-icon" />
        Paused
        <span class="app-footer__sep">&middot;</span>
      </template>
      <span v-if="ready">Updated {{ timeAgo }}</span>
      <span v-else class="app-footer__syncing">Syncing</span>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.app-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  color: var(--color-subtle-foreground);
  font-size: 12px;
  line-height: 1;

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--color-subtle-foreground);

    &--success { background: var(--color-success); }
    &--warn    { background: var(--color-warning); }
    &--neutral { background: var(--color-subtle-foreground); }
  }

  &__host {
    max-width: 260px;
    @include truncate;
  }

  &__pause-icon {
    color: var(--color-muted-foreground);
  }

  &__sep {
    color: var(--color-border);
  }

  &__syncing {
    opacity: 0.5;
  }
}
</style>
