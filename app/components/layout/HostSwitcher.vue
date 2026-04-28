<script setup lang="ts">
// Host switcher dropdown — port of new_frontend Hosts.tsx HostSwitcher +
// AddHostDialog. Source of truth is useHostsStore (loaded from /api/hosts).
// Local add/remove are persisted via the store (see hosts.store.ts).

import { onClickOutside } from '@vueuse/core'
import {
  Server, Plus, Check, Trash2, X, Globe, KeyRound, Edit3, ChevronDown,
  Wifi, WifiOff, AlertCircle,
} from 'lucide-vue-next'
import { useHostsStore } from '~/stores/hosts.store'

const hosts = useHostsStore()
const open = ref(false)
const showAdd = ref(false)
const root = ref<HTMLElement | null>(null)

onClickOutside(root, () => { open.value = false })

const statusMap = {
  online:   { color: 'success', icon: Wifi,        label: 'online' },
  degraded: { color: 'warn',    icon: AlertCircle, label: 'degraded' },
  offline:  { color: 'neutral', icon: WifiOff,     label: 'offline' },
} as const

function pick(id: string) {
  hosts.select(id)
  open.value = false
}

// ---- Add host dialog ----------------------------------------------------
const draft = reactive({ name: '', url: '', token: '' })
function resetDraft() { draft.name = ''; draft.url = ''; draft.token = '' }
function submitAdd() {
  if (!draft.name.trim() || !draft.url.trim()) return
  hosts.add({
    name: draft.name.trim(),
    url: draft.url.trim(),
    token: draft.token.trim() || undefined,
  })
  resetDraft()
  showAdd.value = false
}

watch(showAdd, (v) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = v ? 'hidden' : ''
})
</script>

<template>
  <div ref="root" class="host-switcher">
    <button
      type="button"
      class="host-switcher__trigger"
      :aria-expanded="String(open)"
      :aria-haspopup="'listbox'"
      @click="open = !open"
    >
      <Server :size="16" class="host-switcher__brand-icon" />
      <span class="host-switcher__meta">
        <span class="host-switcher__cap">HOST</span>
        <span class="host-switcher__name">{{ hosts.active?.name ?? '—' }}</span>
      </span>
      <ChevronDown :size="16" class="host-switcher__caret" />
    </button>

    <Transition name="dropdown">
      <div v-if="open" class="host-switcher__panel">
        <div class="host-switcher__panel-head">
          <span class="host-switcher__panel-title">API HOSTS</span>
          <span class="host-switcher__panel-count">{{ hosts.items.length }} total</span>
        </div>

        <div class="host-switcher__list">
          <div
            v-for="h in hosts.items"
            :key="h.id"
            class="host-switcher__row"
            :class="{ 'host-switcher__row--active': h.id === hosts.activeId }"
            @click="pick(h.id)"
          >
            <span class="host-switcher__avatar" :class="{ 'host-switcher__avatar--active': h.id === hosts.activeId }">
              <Check v-if="h.id === hosts.activeId" :size="16" />
              <Server v-else :size="16" />
            </span>
            <div class="host-switcher__row-meta">
              <div class="host-switcher__row-top">
                <span class="host-switcher__row-name">{{ h.name }}</span>
                <span
                  v-if="h.status"
                  class="host-switcher__pill"
                  :class="`host-switcher__pill--${statusMap[h.status].color}`"
                >
                  <component :is="statusMap[h.status].icon" :size="12" />
                  {{ statusMap[h.status].label }}
                </span>
              </div>
              <div class="host-switcher__row-url">{{ h.url ?? h.id }}</div>
            </div>
            <button
              v-if="!h.current"
              type="button"
              class="host-switcher__remove"
              title="Remove host"
              @click.stop="hosts.remove(h.id)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>

        <button
          type="button"
          class="host-switcher__add"
          @click="showAdd = true; open = false"
        >
          <Plus :size="16" />
          <span>Add new host</span>
        </button>
      </div>
    </Transition>

    <!-- Add host modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAdd"
          class="host-modal"
          @click.self="showAdd = false"
        >
          <div class="host-modal__card" @click.stop>
            <div class="host-modal__head">
              <span class="host-modal__title">
                <Plus :size="16" />
                Add API host
              </span>
              <button type="button" class="host-modal__close" @click="showAdd = false">
                <X :size="16" />
              </button>
            </div>

            <form class="host-modal__body" @submit.prevent="submitAdd">
              <label class="host-modal__field">
                <span class="host-modal__label">Display name</span>
                <span class="host-modal__wrap">
                  <Edit3 :size="16" class="host-modal__icon" />
                  <input
                    v-model="draft.name"
                    autofocus
                    placeholder="Production EU"
                    class="host-modal__input"
                  >
                </span>
              </label>

              <label class="host-modal__field">
                <span class="host-modal__label">Docker API URL</span>
                <span class="host-modal__wrap">
                  <Globe :size="16" class="host-modal__icon" />
                  <input
                    v-model="draft.url"
                    placeholder="https://10.0.0.10:2376"
                    class="host-modal__input host-modal__input--mono"
                  >
                </span>
              </label>

              <label class="host-modal__field">
                <span class="host-modal__label">Bearer token (optional)</span>
                <span class="host-modal__wrap">
                  <KeyRound :size="16" class="host-modal__icon" />
                  <input
                    v-model="draft.token"
                    type="password"
                    placeholder="••••••••"
                    class="host-modal__input host-modal__input--mono"
                  >
                </span>
              </label>

              <div class="host-modal__actions">
                <button type="button" class="host-modal__cancel" @click="showAdd = false">Cancel</button>
                <button
                  type="submit"
                  class="host-modal__submit"
                  :disabled="!draft.name.trim() || !draft.url.trim()"
                >
                  <Plus :size="14" />
                  Add host
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.host-switcher {
  position: relative;

  &__trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    height: 40px;
    padding: 0 var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-card);
    color: var(--color-foreground);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: background-color $transition-fast;

    &:hover { background: var(--color-accent); }
  }

  &__brand-icon { color: var(--emerald-400); }
  &__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.1;
  }
  &__cap {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--color-subtle-foreground);
  }
  &__name { font-size: 13px; }
  &__caret { color: var(--color-subtle-foreground); }

  &__panel {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    width: min(360px, calc(100vw - 2rem));
    background: var(--color-popover);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    z-index: $z-dropdown;
    overflow: hidden;

    @include until($bp-sm) {
      position: fixed;
      left: var(--space-4);
      right: var(--space-4);
      top: 72px;
      width: auto;
    }
  }

  &__panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-divider);
  }
  &__panel-title {
    color: var(--color-muted-foreground);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }
  &__panel-count {
    color: var(--color-subtle-foreground);
    font-size: 11px;
  }

  &__list {
    max-height: 320px;
    overflow-y: auto;
    @include scrollbar(8px);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 10px var(--space-4);
    cursor: pointer;
    transition: background-color $transition-fast;

    &:hover { background: var(--color-accent); }
    &--active {
      background: rgb(16 185 129 / 0.10);
      &:hover { background: rgb(16 185 129 / 0.14); }
    }

    .theme--dark &--active { background: rgb(16 185 129 / 0.10); }
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--color-muted);
    color: var(--color-muted-foreground);

    &--active {
      background: linear-gradient(135deg, var(--emerald-500), var(--cyan-600));
      color: #ffffff;
    }
  }

  &__row-meta { flex: 1 1 auto; min-width: 0; }
  &__row-top {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  &__row-name {
    font-size: 13px;
    font-weight: 600;
    @include truncate;
  }
  &__row-url {
    font-family: $font-stack-mono;
    font-size: 11px;
    color: var(--color-subtle-foreground);
    @include truncate;
  }

  &__pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 6px;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    font-size: 10px;
    font-weight: 600;
    line-height: 1.4;

    &--success { background: rgb(16 185 129 / 0.12); color: var(--emerald-500); border-color: rgb(16 185 129 / 0.30); }
    &--warn    { background: rgb(245 158 11 / 0.12); color: var(--amber-500);  border-color: rgb(245 158 11 / 0.30); }
    &--neutral { background: rgb(100 116 139 / 0.15); color: var(--slate-400); border-color: rgb(100 116 139 / 0.30); }
    .theme--dark &--success { color: var(--emerald-300); }
    .theme--dark &--warn    { color: var(--amber-300); }
  }

  &__remove {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
    color: var(--red-400);
    border-radius: var(--radius-md);
    cursor: pointer;
    opacity: 0;
    transition: opacity $transition-fast, background-color $transition-fast;

    &:hover { background: rgb(239 68 68 / 0.10); }
  }
  &__row:hover &__remove { opacity: 1; }

  &__add {
    width: 100%;
    padding: var(--space-3);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 0;
    border-top: 1px solid var(--color-divider);
    background: transparent;
    color: var(--emerald-500);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color $transition-fast;

    &:hover { background: var(--color-accent); }
  }
}

.host-modal {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  background: rgba(2, 6, 23, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);

  &__card {
    width: 100%;
    max-width: 440px;
    background: var(--color-popover);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid var(--color-divider);
  }
  &__title {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 16px;
    font-weight: 700;
    color: var(--color-foreground);
    .lucide { color: var(--emerald-500); }
  }
  &__close {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
    border-radius: var(--radius-md);
    color: var(--color-muted-foreground);
    cursor: pointer;
    &:hover { background: var(--color-accent); color: var(--color-foreground); }
  }

  &__body {
    padding: var(--space-5) var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  &__field { display: flex; flex-direction: column; gap: 6px; }
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
  }
  &__input {
    width: 100%;
    height: 40px;
    padding: 0 var(--space-3) 0 36px;
    background: var(--color-input-background);
    border: 1px solid var(--color-input-border);
    border-radius: var(--radius-lg);
    color: var(--color-foreground);
    font-size: 13px;

    &::placeholder { color: var(--color-subtle-foreground); }
    &:focus { outline: none; border-color: var(--emerald-500); box-shadow: 0 0 0 3px rgb(16 185 129 / 0.20); }
    &--mono { font-family: $font-stack-mono; }
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-divider);
  }
  &__cancel {
    height: 36px;
    padding: 0 var(--space-4);
    border: 0;
    background: transparent;
    color: var(--color-foreground);
    font-size: 13px;
    font-weight: 600;
    border-radius: var(--radius-lg);
    cursor: pointer;
    &:hover { background: var(--color-accent); }
  }
  &__submit {
    height: 36px;
    padding: 0 var(--space-4);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 0;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, var(--emerald-500), var(--cyan-600));
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 24px -10px rgba(16, 185, 129, 0.45);

    &:hover:not(:disabled) { opacity: 0.92; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
}

.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity $transition-fast, transform $transition-fast;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.modal-enter-active, .modal-leave-active { transition: opacity $transition-base; }
.modal-enter-active .host-modal__card, .modal-leave-active .host-modal__card {
  transition: transform $transition-base, opacity $transition-base;
}
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .host-modal__card, .modal-leave-to .host-modal__card {
  transform: scale(0.96);
  opacity: 0;
}
</style>
