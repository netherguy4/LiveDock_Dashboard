<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  modelValue?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  id?: string
  autocomplete?: string
  icon?: Component | null
  glow?: boolean
  mono?: boolean
  autofocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  type: 'text',
  placeholder: undefined,
  error: undefined,
  label: undefined,
  id: undefined,
  autocomplete: undefined,
  icon: null,
  glow: false,
  mono: false,
  autofocus: false,
})
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const autoId = useId()
const inputId = computed(() => props.id ?? autoId)
</script>

<template>
  <div class="field" :class="{ 'field--error': !!error, 'field--glow': glow, 'field--mono': mono }">
    <label v-if="label" :for="inputId" class="field__label">{{ label }}</label>
    <div class="field__wrap">
      <component :is="icon" v-if="icon" class="field__icon" :size="16" />
      <input
        :id="inputId"
        class="field__input"
        :class="{ 'field__input--with-icon': !!icon }"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :autofocus="autofocus"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
    </div>
    <p v-if="error" class="field__error">{{ error }}</p>
  </div>
</template>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted-foreground);
  }
  &__wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  &__icon {
    position: absolute;
    left: 12px;
    color: var(--color-subtle-foreground);
    pointer-events: none;
    z-index: 2;
  }
  &__input {
    width: 100%;
    height: 44px;
    padding: 0 var(--space-3);
    background: var(--color-input-background);
    border: 1px solid var(--color-input-border);
    border-radius: var(--radius-lg);
    font-size: var(--fs-body);
    color: var(--color-foreground);
    position: relative;
    z-index: 1;
    transition: border-color $transition-fast, background-color $transition-fast,
                box-shadow $transition-fast;

    &--with-icon { padding-left: 36px; }
    &::placeholder { color: var(--color-subtle-foreground); }
    &:focus {
      outline: none;
      border-color: var(--emerald-500);
      box-shadow: 0 0 0 3px rgb(16 185 129 / 0.20);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  &__error {
    font-size: var(--fs-small);
    color: var(--color-danger);
  }
  &--mono &__input {
    font-family: $font-stack-mono;
  }
  &--error &__input {
    border-color: var(--color-danger);
    &:focus { box-shadow: 0 0 0 3px rgb(239 68 68 / 0.25); }
  }

  // Glow ring for login inputs (radial highlight follows --lx/--ly set by parent)
  &--glow .field__wrap::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: var(--radius-lg);
    padding: 1px;
    background: radial-gradient(
      140px circle at var(--lx, 50%) var(--ly, 50%),
      rgba(94, 234, 212, 0.85),
      rgba(34, 211, 238, 0.30) 50%,
      transparent 80%
    );
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
            mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            mask-composite: exclude;
    pointer-events: none;
    z-index: 2;
  }
}
</style>
