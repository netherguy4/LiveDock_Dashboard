<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'neutral' | 'success' | 'warn' | 'warning' | 'danger' | 'info' | 'brand'
    size?: 'sm' | 'md'
  }>(),
  { tone: 'neutral', size: 'md' },
)
</script>

<template>
  <span class="badge" :class="[`badge--${tone === 'warning' ? 'warn' : tone}`, `badge--${size}`]">
    <slot />
  </span>
</template>

<style lang="scss" scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px var(--space-2);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  border: 1px solid transparent;
  white-space: nowrap;

  &--sm { font-size: 0.6875rem; padding: 1px 6px; }

  // Tones — light theme defaults; .theme--dark below for dark tones with ring
  &--neutral {
    background: var(--slate-100);
    color: var(--slate-700);
  }
  &--success {
    background: rgb(16 185 129 / 0.10);
    color: var(--emerald-600);
    border-color: rgb(16 185 129 / 0.30);
  }
  &--warn {
    background: rgb(245 158 11 / 0.10);
    color: #b45309;
    border-color: rgb(245 158 11 / 0.30);
  }
  &--danger {
    background: rgb(239 68 68 / 0.10);
    color: #b91c1c;
    border-color: rgb(239 68 68 / 0.30);
  }
  &--info {
    background: rgb(59 130 246 / 0.10);
    color: #1d4ed8;
    border-color: rgb(59 130 246 / 0.30);
  }
  &--brand {
    background: rgb(20 184 166 / 0.10);
    color: var(--teal-600);
    border-color: rgb(20 184 166 / 0.30);
  }

  .theme--dark & {
    &.badge--neutral { background: var(--slate-800); color: var(--slate-300); border-color: var(--slate-700); }
    &.badge--success { color: var(--emerald-300); }
    &.badge--warn    { color: var(--amber-300); }
    &.badge--danger  { color: var(--red-300); }
    &.badge--info    { color: var(--blue-400); }
    &.badge--brand   { color: var(--teal-400); }
  }
}
</style>
