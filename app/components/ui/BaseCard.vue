<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  padded?: boolean
}>()
</script>

<template>
  <article class="card" :class="{ 'card--padded': padded ?? true }">
    <header v-if="title || $slots.header" class="card__header">
      <slot name="header">
        <div class="card__titles">
          <h3 class="card__title">{{ title }}</h3>
          <p v-if="subtitle" class="card__subtitle">{{ subtitle }}</p>
        </div>
      </slot>
      <div v-if="$slots.actions" class="card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="card__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<style lang="scss" scoped>
.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
  overflow: hidden;

  &--padded {
    .card__header { padding: var(--space-4) var(--space-5); }
    .card__body   { padding: var(--space-5); }
    .card__footer { padding: var(--space-4) var(--space-5); }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    border-bottom: 1px solid var(--color-divider);
  }
  &__titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  &__title {
    font-size: var(--fs-h3);
    font-weight: 700;
    margin: 0;
    @include truncate;
  }
  &__subtitle {
    font-size: var(--fs-small);
    color: var(--color-muted-foreground);
    margin: 0;
  }
  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  &__body {
    flex: 1 1 auto;
    min-width: 0;
  }
  &__footer {
    border-top: 1px solid var(--color-divider);
  }
}
</style>
