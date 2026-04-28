<script setup lang="ts">
defineProps<{ title?: string; description?: string }>()
</script>

<template>
  <div class="empty">
    <div class="empty__icon"><slot name="icon">∅</slot></div>
    <h4 v-if="title" class="empty__title">{{ title }}</h4>
    <p v-if="description" class="empty__desc">{{ description }}</p>
    <div v-if="$slots.action" class="empty__action"><slot name="action" /></div>
  </div>
</template>

<style lang="scss" scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-8) var(--space-4);
  color: var(--color-muted-foreground);

  &__icon {
    font-size: 2rem;
    opacity: 0.4;
    margin-bottom: var(--space-2);
  }
  &__title { font-size: 0.9375rem; font-weight: 600; color: var(--color-foreground); }
  &__desc  { font-size: 0.8125rem; max-width: 32ch; }
  &__action { margin-top: var(--space-3); }
}
</style>
