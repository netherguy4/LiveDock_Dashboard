<script setup lang="ts">
import { Check, Edit3, Plus, Trash2, UserRound, X } from 'lucide-vue-next'
import type { ManagedUser } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth.store'
import { useUsersStore } from '~/stores/users.store'

definePageMeta({ layout: 'default' })
useHead({ title: 'LiveDock · Users' })

const auth = useAuthStore()
const users = useUsersStore()
const dialogOpen = ref(false)
const deleteId = ref('')
const demoLoading = ref(false)

async function toggleDemo(enabled: boolean) {
  demoLoading.value = true
  try {
    await $fetch('/api/admin/demo/toggle', {
      method: 'PATCH',
      body: { enabled },
    })
    await users.load()
  } finally {
    demoLoading.value = false
  }
}
const loaded = ref(false)
const draft = reactive({ id: '', login: '', password: '' })
const isEditing = computed(() => Boolean(draft.id))
const showSkeleton = computed(() => users.loading || (auth.kind === 'admin' && !loaded.value))

function resetDraft() {
  draft.id = ''
  draft.login = ''
  draft.password = ''
}

function openCreate() {
  resetDraft()
  dialogOpen.value = true
}

function openEdit(user: ManagedUser) {
  draft.id = user.id
  draft.login = user.login
  draft.password = ''
  dialogOpen.value = true
}

async function submitUser() {
  const login = draft.login.trim()
  const password = draft.password
  if (!login || (!isEditing.value && !password)) return
  if (isEditing.value) {
    await users.update(draft.id, { login, ...(password ? { password } : {}) })
  } else {
    await users.create({ login, password })
  }
  dialogOpen.value = false
  resetDraft()
}

async function removeUser(id: string) {
  await users.remove(id)
  deleteId.value = ''
}

onMounted(() => {
  if (auth.kind !== 'admin') return
  void users.load().finally(() => {
    loaded.value = true
  })
})
</script>

<template>
  <section class="users-page">
    <header class="users-page__head">
      <div>
        <h1 class="users-page__title">Users</h1>
        <p class="users-page__subtitle">Regular accounts with isolated host lists</p>
      </div>
      <button type="button" class="users-page__primary" @click="openCreate">
        <Plus :size="16" />
        Add user
      </button>
    </header>

    <div class="users-page__table">
      <div class="users-page__row users-page__row--head">
        <span>Login</span>
        <span>Created</span>
        <span>Updated</span>
        <span />
      </div>

      <template v-if="showSkeleton">
        <div
          v-for="i in 5"
          :key="i"
          class="users-page__row users-page__row--skeleton"
          aria-hidden="true"
        >
          <span class="users-page__sk-user">
            <span class="users-page__sk-avatar" />
            <span class="users-page__sk-line users-page__sk-line--login" />
          </span>
          <span class="users-page__sk-line users-page__sk-line--date" />
          <span class="users-page__sk-line users-page__sk-line--date" />
          <span class="users-page__sk-actions">
            <span class="users-page__sk-button" />
            <span class="users-page__sk-button" />
          </span>
        </div>
      </template>
      <div v-else-if="users.items.length === 0" class="users-page__empty">No users yet</div>

      <div
        v-for="user in users.items"
        v-else
        :key="user.id"
        class="users-page__row"
      >
        <span class="users-page__login">
          <UserRound :size="16" />
          <span class="users-page__login-text">{{ user.login }}</span>
        </span>
        <span class="users-page__meta" data-label="Created">{{ new Date(user.createdAt).toLocaleString() }}</span>
        <span class="users-page__meta" data-label="Updated">{{ new Date(user.updatedAt).toLocaleString() }}</span>
        <span class="users-page__actions">
          <template v-if="user.login === 'demo'">
            <label class="users-page__dt" :class="{ 'users-page__dt--loading': demoLoading }">
              <input
                type="checkbox"
                class="users-page__dt-input"
                role="switch"
                :checked="user.demo"
                :disabled="demoLoading"
                :aria-checked="String(user.demo)"
                @change="toggleDemo(!user.demo)"
              >
              <span class="users-page__dt-track" />
              <span class="users-page__dt-label">{{ user.demo ? 'Demo on' : 'Demo off' }}</span>
            </label>
          </template>
          <template v-else>
            <button type="button" class="users-page__icon" title="Edit user" @click="openEdit(user)">
              <Edit3 :size="15" />
            </button>
            <button
              v-if="deleteId !== user.id"
              type="button"
              class="users-page__icon users-page__icon--danger"
              title="Delete user"
              @click="deleteId = user.id"
            >
              <Trash2 :size="15" />
            </button>
            <button
              v-else
              type="button"
              class="users-page__confirm"
              @click="removeUser(user.id)"
            >
              Delete
            </button>
          </template>
        </span>
      </div>
    </div>

    <p v-if="users.error" class="users-page__error">{{ users.error }}</p>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="dialogOpen" class="user-modal" @click.self="dialogOpen = false">
          <form class="user-modal__card" @submit.prevent="submitUser">
            <div class="user-modal__head">
              <span class="user-modal__title">
                <component :is="isEditing ? Edit3 : Plus" :size="16" />
                {{ isEditing ? 'Edit user' : 'Add user' }}
              </span>
              <button type="button" class="user-modal__close" @click="dialogOpen = false">
                <X :size="16" />
              </button>
            </div>

            <div class="user-modal__body">
              <label class="user-modal__field">
                <span class="user-modal__label">Login</span>
                <input v-model="draft.login" class="user-modal__input" autocomplete="off">
              </label>
              <label class="user-modal__field">
                <span class="user-modal__label">{{ isEditing ? 'New password' : 'Password' }}</span>
                <input v-model="draft.password" class="user-modal__input" type="password" autocomplete="new-password">
              </label>
            </div>

            <div class="user-modal__actions">
              <button type="button" class="user-modal__cancel" @click="dialogOpen = false">Cancel</button>
              <button
                type="submit"
                class="user-modal__submit"
                :disabled="users.saving || !draft.login.trim() || (!isEditing && !draft.password)"
              >
                <Check :size="14" />
                Save
              </button>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style lang="scss" scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  &__title {
    margin: 0;
    font-size: var(--fs-h1);
    font-weight: var(--fw-bold);
  }

  &__subtitle {
    margin: 4px 0 0;
    color: var(--color-subtle-foreground);
  }

  &__primary,
  &__confirm {
    height: 36px;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    border: 0;
    border-radius: var(--radius-lg);
    padding: 0 var(--space-4);
    cursor: pointer;
    font-weight: 600;
  }

  &__primary {
    background: var(--gradient-brand);
    color: #ffffff;
  }

  &__confirm {
    background: var(--red-500);
    color: #ffffff;
  }

  &__table {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    background: var(--color-card);
    overflow: hidden;

    @include until($bp-md) {
      border-radius: var(--radius-lg);
    }
  }

  &__row {
    display: grid;
    grid-template-columns: minmax(160px, 1.2fr) minmax(150px, 1fr) minmax(150px, 1fr) auto;
    align-items: center;
    gap: var(--space-4);
    min-height: 52px;
    padding: 0 var(--space-4);
    border-top: 1px solid var(--color-divider);
    color: var(--color-muted-foreground);
    font-size: 13px;

    &:first-child { border-top: 0; }

    &--head {
      min-height: 40px;
      background: var(--color-row-header);
      color: var(--color-subtle-foreground);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    &--skeleton {
      pointer-events: none;
    }

    @include until($bp-md) {
      grid-template-columns: 1fr auto;
      gap: var(--space-2) var(--space-3);
      min-height: 0;
      padding: var(--space-3) var(--space-4);

      &--head { display: none; }

      &--skeleton {
        grid-template-columns: 1fr auto;
      }
    }
  }

  &__login,
  &__actions {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__login {
    color: var(--color-foreground);
    font-weight: 700;
    min-width: 0;

    @include until($bp-md) {
      grid-column: 1;
      grid-row: 1;
    }
  }

  &__login-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    @include until($bp-md) {
      display: grid;
      grid-template-columns: 64px minmax(0, 1fr);
      grid-column: 1 / -1;
      gap: var(--space-2);
      font-family: $font-stack-mono;
      font-size: 11px;
      line-height: 1.45;

      &::before {
        content: attr(data-label);
        color: var(--color-subtle-foreground);
        font-family: $font-stack-sans;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
    }
  }

  &__sk-user,
  &__sk-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__sk-actions {
    justify-content: flex-end;

    @include until($bp-md) {
      grid-column: 2;
      grid-row: 1;
    }
  }

  &__sk-avatar,
  &__sk-button,
  &__sk-line {
    display: inline-block;
    flex-shrink: 0;
  }

  &__sk-avatar {
    @include skeleton(28px, 28px);

    border-radius: var(--radius-md);
  }

  &__sk-button {
    @include skeleton(32px, 32px);

    border-radius: var(--radius-md);
  }

  &__sk-line {
    @include skeleton(12px, 100%);

    border-radius: var(--radius-sm);

    &--login {
      width: min(128px, 42vw);
    }

    &--date {
      width: min(168px, 48vw);

      @include until($bp-md) {
        grid-column: 1 / -1;
        width: min(220px, 66vw);
        margin-left: 72px;
      }
    }
  }

  &__actions {
    justify-content: flex-end;

    @include until($bp-md) {
      grid-column: 2;
      grid-row: 1;
      align-self: center;
    }
  }

  &__icon {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-muted-foreground);
    cursor: pointer;

    &:hover { background: var(--color-accent); color: var(--color-foreground); }

    &--danger {
      color: var(--red-400);
    }
  }

  &__empty {
    padding: var(--space-8);
    text-align: center;
    color: var(--color-subtle-foreground);
  }

  &__error {
    color: var(--red-400);
    margin: 0;
  }
}

// Demo toggle
.users-page__dt {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;

  &--loading { opacity: 0.5; pointer-events: none; }
}

.users-page__dt-input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;

  &:focus-visible + .users-page__dt-track {
    outline: 2px solid var(--emerald-500);
    outline-offset: 2px;
  }
}

.users-page__dt-track {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: var(--color-track);
  transition: background-color $transition-fast;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-primary-foreground);
    box-shadow: var(--shadow-sm);
    transition: transform $transition-fast;
  }
}

.users-page__dt-input:checked + .users-page__dt-track {
  background: linear-gradient(135deg, var(--brand-from), var(--brand-to));

  &::after { transform: translateX(14px); }
}

.users-page__dt-label {
  color: var(--color-subtle-foreground);
  font-size: 12px;
  font-weight: 600;
  min-width: 64px;
}

.user-modal {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: rgba(2, 6, 23, 0.7);
  backdrop-filter: blur(4px);

  &__card {
    width: 100%;
    max-width: 420px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    background: var(--color-popover);
    overflow: hidden;
  }

  &__head,
  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
  }

  &__head {
    border-bottom: 1px solid var(--color-divider);
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: 700;
  }

  &__close {
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-muted-foreground);
    cursor: pointer;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-5);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__label {
    color: var(--color-muted-foreground);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  &__input {
    height: 40px;
    border: 1px solid var(--color-input-border);
    border-radius: var(--radius-lg);
    background: var(--color-input-background);
    color: var(--color-foreground);
    padding: 0 var(--space-3);
  }

  &__actions {
    justify-content: flex-end;
    gap: var(--space-2);
    border-top: 1px solid var(--color-divider);
  }

  &__cancel,
  &__submit {
    height: 36px;
    border: 0;
    border-radius: var(--radius-lg);
    padding: 0 var(--space-4);
    cursor: pointer;
    font-weight: 600;
  }

  &__cancel {
    background: transparent;
    color: var(--color-foreground);
  }

  &__submit {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--gradient-brand);
    color: #ffffff;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }
  }
}
</style>
