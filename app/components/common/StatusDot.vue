<script setup lang="ts">
// Small round status indicator. Running state gets an animated ping ring.
import type { ContainerStatus } from '~/constants/status'

withDefaults(
  defineProps<{
    status: ContainerStatus | 'ok' | 'warn' | 'danger'
    pulse?: boolean
    size?: number
  }>(),
  { pulse: true, size: 10 },
)
</script>

<template>
  <span
    class="dot"
    :class="`dot--${status}`"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <span
      v-if="pulse && (status === 'running' || status === 'ok')"
      class="dot__ping"
      aria-hidden="true"
    />
    <span class="dot__core" />
  </span>
</template>

<style lang="scss" scoped>
.dot {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;

  &__core {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
  &__ping {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    opacity: 0.6;
    animation: dot-ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  &--running .dot__core, &--ok .dot__core         { background: var(--emerald-500); }
  &--running .dot__ping, &--ok .dot__ping         { background: var(--emerald-400); }
  &--warning .dot__core, &--warn .dot__core,
  &--degraded .dot__core                           { background: var(--amber-500); }
  &--warning .dot__ping, &--warn .dot__ping,
  &--degraded .dot__ping                           { background: var(--amber-400); }
  &--stopped .dot__core, &--danger .dot__core,
  &--exited .dot__core                             { background: var(--slate-500); }
  &--stopped .dot__ping, &--danger .dot__ping,
  &--exited .dot__ping                             { background: var(--slate-400); }
}

@keyframes dot-ping {
  0%   { transform: scale(1);   opacity: 0.6; }
  75%  { transform: scale(2);   opacity: 0;   }
  100% { transform: scale(2.2); opacity: 0;   }
}
</style>
