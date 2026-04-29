<script setup lang="ts">
// Login screen — visual port of new_frontend/src/app/components/Login.tsx.
// Submits to /api/login (httpOnly cookie session) via useAuthStore — we
// intentionally do NOT do any client-side credential check.

import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-vue-next'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import LoginGridOverlay from '~/components/blocks/LoginGridOverlay.vue'
import Logo from '~/components/common/Logo.vue'
import { ROUTES } from '~/configs/routes.config'
import { useAuthStore } from '~/stores/auth.store'
import { loginSchema } from '~/utils/validation/login.schema'

definePageMeta({ layout: 'auth' })
useHead({ title: 'LiveDock · Sign in' })

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const submitError = ref('')
const showPwd = ref(false)
const lit = ref(1)

const { handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: { login: '', password: '' },
})
const { value: login } = useField<string>('login')
const { value: password } = useField<string>('password')

const onSubmit = handleSubmit(async (values) => {
  submitting.value = true
  submitError.value = ''
  try {
    await auth.login(values.login, values.password)
    const redirect = String(route.query.redirect ?? ROUTES.HOME)
    router.replace(redirect.startsWith('/') ? redirect : ROUTES.HOME)
  } catch {
    submitError.value = 'Неверный логин или пароль'
  } finally {
    submitting.value = false
  }
})

// ---- Cursor tracking ----------------------------------------------------
const rootRef = ref<HTMLElement | null>(null)
const formRef = ref<HTMLElement | null>(null)
let raf: number | null = null

const setLocalVars = (el: HTMLElement | null, x: number, y: number) => {
  if (!el) return
  const r = el.getBoundingClientRect()
  el.style.setProperty('--lx', `${x - r.left}px`)
  el.style.setProperty('--ly', `${y - r.top}px`)
}

function onMouseMove(e: MouseEvent) {
  if (raf != null) return
  raf = requestAnimationFrame(() => {
    raf = null
    const el = rootRef.value
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
    setLocalVars(formRef.value, e.clientX, e.clientY)
    el.querySelectorAll<HTMLElement>('[data-glow-wrap]').forEach((node) => {
      setLocalVars(node, e.clientX, e.clientY)
    })
  })
}
</script>

<template>
  <div
    ref="rootRef"
    class="login-screen"
    :style="{ '--lit': lit }"
    @mousemove="onMouseMove"
    @mouseenter="lit = 1"
    @mouseleave="lit = 0"
  >
    <LoginGridOverlay />

    <div class="login-screen__inner">
      <div class="login-screen__logo">
        <Logo layout="stacked" size="lg" />
      </div>

      <form ref="formRef" class="login-card" @submit.prevent="onSubmit">
        <span class="login-card__ring" aria-hidden="true" />

        <div class="login-card__head">
          <h1 class="login-card__title">Авторизация</h1>
          <p class="login-card__sub">Введите учётные данные администратора</p>
        </div>

        <div class="login-card__fields">
          <div class="login-card__field">
            <label class="login-card__label" for="login-input">Логин</label>
            <div data-glow-wrap class="login-card__wrap">
              <span class="login-card__glow" aria-hidden="true" />
              <User :size="16" class="login-card__icon" />
              <input
                id="login-input"
                v-model="login"
                autofocus
                autocomplete="username"
                placeholder="admin"
                class="login-card__input"
              >
            </div>
            <p v-if="errors.login" class="login-card__hint">{{ errors.login }}</p>
          </div>

          <div class="login-card__field">
            <label class="login-card__label" for="pwd-input">Пароль</label>
            <div data-glow-wrap class="login-card__wrap">
              <span class="login-card__glow" aria-hidden="true" />
              <Lock :size="16" class="login-card__icon" />
              <input
                id="pwd-input"
                v-model="password"
                :type="showPwd ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="login-card__input login-card__input--pwd"
              >
              <button
                type="button"
                class="login-card__toggle"
                :aria-label="showPwd ? 'Скрыть пароль' : 'Показать пароль'"
                @click="showPwd = !showPwd"
              >
                <component :is="showPwd ? EyeOff : Eye" :size="16" />
              </button>
            </div>
            <p v-if="errors.password" class="login-card__hint">{{ errors.password }}</p>
          </div>

          <div v-if="submitError" class="login-card__error" role="alert" aria-live="assertive">
            <AlertCircle :size="16" />
            <span>{{ submitError }}</span>
          </div>

          <button
            type="submit"
            class="login-card__submit"
            :disabled="submitting || !login || !password"
          >
            <span v-if="submitting" class="login-card__spinner" />
            <template v-else>
              Войти
              <ArrowRight :size="16" />
            </template>
          </button>
        </div>
      </form>

      <div class="login-screen__caption">LiveDock · защищённая зона</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-screen {
  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: var(--slate-950);
  overflow: hidden;

  &__inner {
    position: relative;
    width: 100%;
    max-width: 420px;
    z-index: 1;
  }

  &__logo {
    display: flex;
    justify-content: center;
    margin-bottom: var(--space-8);
  }

  &__caption {
    text-align: center;
    margin-top: var(--space-6);
    color: var(--slate-500);
    font-size: 12px;
  }
}

.login-card {
  position: relative;
  background: var(--slate-900);
  border: 1px solid var(--slate-800);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: 0 25px 50px -12px rgba(16, 185, 129, 0.05);

  &__ring {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: radial-gradient(
      260px circle at var(--lx, 50%) var(--ly, 50%),
      rgba(94, 234, 212, 0.7),
      rgba(34, 211, 238, 0.25) 50%,
      transparent 75%
    );
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
            mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            mask-composite: exclude;
    pointer-events: none;
    opacity: var(--lit, 1);
    transition: opacity 600ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  &__head { margin-bottom: var(--space-6); }
  &__title {
    margin: 0;
    color: #ffffff;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }
  &__sub {
    margin: 4px 0 0;
    color: var(--slate-400);
    font-size: 13px;
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    position: relative;
    z-index: 1;
  }

  &__field { display: flex; flex-direction: column; gap: 6px; }
  &__label {
    color: var(--slate-400);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  &__wrap {
    position: relative;
    display: flex;
    align-items: center;
    border-radius: var(--radius-lg);
  }
  &__glow {
    position: absolute;
    inset: 0;
    border-radius: inherit;
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
    opacity: var(--lit, 1);
    transition: opacity 600ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  &__icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--slate-500);
    pointer-events: none;
    z-index: 1;
  }
  &__input {
    position: relative;
    z-index: 0;
    width: 100%;
    height: 44px;
    padding: 0 var(--space-3) 0 36px;
    border-radius: var(--radius-lg);
    background: var(--slate-950);
    border: 1px solid var(--slate-700);
    color: #ffffff;
    font-size: 14px;

    &::placeholder { color: var(--slate-600); }
    &:focus {
      outline: none;
      border-color: var(--emerald-500);
      box-shadow: 0 0 0 3px rgb(16 185 129 / 0.30);
    }
    &--pwd { padding-right: 40px; }
  }
  &__toggle {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    color: var(--slate-500);
    background: transparent;
    cursor: pointer;
    z-index: 3;

    &:hover { color: var(--slate-300); background: rgba(255, 255, 255, 0.04); }
  }

  &__hint {
    margin: 0;
    color: var(--red-400);
    font-size: 12px;
  }

  &__error {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-lg);
    background: rgb(239 68 68 / 0.10);
    border: 1px solid rgb(239 68 68 / 0.30);
    color: var(--red-300);
    font-size: 13px;
  }

  &__submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    height: 44px;
    border: 0;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, var(--emerald-500), var(--cyan-600));
    color: #ffffff;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 12px 32px -10px rgba(16, 185, 129, 0.45);
    transition: opacity $transition-fast, filter $transition-fast;

    &:hover:not(:disabled) { opacity: 0.92; filter: brightness(1.05); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: login-spin 0.7s linear infinite;
  }
}

@keyframes login-spin {
  to { transform: rotate(360deg); }
}
</style>

<style lang="scss">
/* @property registration must be unscoped — Vue scoped styles can't host it.
   --lit is a plain custom property (0/1 toggle); opacity transition on each
   layer carries the fade. Transitioning a registered property directly via
   var() chains is unreliable in Chromium. */
@property --mx {
  syntax: '<length-percentage>';
  inherits: true;
  initial-value: 50%;
}
@property --my {
  syntax: '<length-percentage>';
  inherits: true;
  initial-value: 50%;
}

@media (hover: none) and (pointer: coarse) {
  .login-screen {
    --lit: 1;
    animation: login-orbit 18s linear infinite;
  }
}

@keyframes login-orbit {
  0%   { --mx: 30%; --my: 38%; }
  25%  { --mx: 72%; --my: 30%; }
  50%  { --mx: 76%; --my: 68%; }
  75%  { --mx: 28%; --my: 72%; }
  100% { --mx: 30%; --my: 38%; }
}

@media (prefers-reduced-motion: reduce) {
  .login-screen { animation: none; }
}
</style>
