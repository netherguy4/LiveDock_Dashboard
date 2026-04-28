<script setup lang="ts">
// Generic button used across the app. BEM modifiers control variant/size,
// no utility classes. Renders <a> when `to` is supplied (NuxtLink), <button>
// otherwise.
import { NuxtLink } from '#components'

interface Props {
  to?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'solid' | 'gradient'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  disabled?: boolean
  loading?: boolean
  full?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  to: undefined,
  variant: 'primary',
  size: 'md',
  type: 'button',
})

const tag = computed(() => (props.to ? NuxtLink : 'button'))
const variant = computed(() => {
  // `solid` and `gradient` are aliases kept for backwards-compat with older callers.
  if (props.variant === 'solid' || props.variant === 'gradient') return 'primary'
  return props.variant
})
const classes = computed(() => [
  'btn',
  `btn--${variant.value}`,
  `btn--${props.size}`,
  { 'btn--full': props.full, 'btn--loading': props.loading },
])
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :type="to ? undefined : type"
    :disabled="disabled || loading"
    :class="classes"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true" />
    <slot />
  </component>
</template>

<style lang="scss" scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  height: 40px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.8125rem;
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: background-color $transition-fast, border-color $transition-fast,
              color $transition-fast, opacity $transition-fast, filter $transition-fast,
              transform $transition-fast;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  // Sizes
  &--sm   { height: 32px; padding: 0 var(--space-3); font-size: 0.75rem; border-radius: var(--radius-md); gap: 6px; }
  &--md   { height: 40px; }
  &--lg   { height: 48px; padding: 0 var(--space-5); font-size: 0.875rem; border-radius: var(--radius-xl); }
  &--icon { width: 40px; height: 40px; padding: 0; }
  &--full { width: 100%; }

  // Variants — match the new design (App.tsx Button helper)
  &--primary {
    background: var(--gradient-brand);
    color: #ffffff;
    box-shadow: 0 8px 24px -8px var(--color-brand-glow);
    &:hover:not(:disabled) { filter: brightness(1.05); opacity: 0.92; }
  }
  &--secondary {
    background: var(--slate-100);
    color: var(--slate-900);
    &:hover:not(:disabled) { background: #ffffff; }
    .theme--dark & {
      background: var(--slate-800);
      color: var(--slate-200);
      &:hover:not(:disabled) { background: var(--slate-700); }
    }
  }
  &--ghost {
    background: transparent;
    color: var(--color-foreground);
    &:hover:not(:disabled) { background: var(--color-accent); }
  }
  &--outline {
    background: transparent;
    color: var(--color-foreground);
    border-color: var(--color-border);
    &:hover:not(:disabled) { background: var(--color-accent); }
  }
  &--danger {
    background: var(--red-500);
    color: #ffffff;
    &:hover:not(:disabled) { background: #dc2626; }
  }

  &__spinner {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: btn-spin 0.7s linear infinite;
  }
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}
</style>
