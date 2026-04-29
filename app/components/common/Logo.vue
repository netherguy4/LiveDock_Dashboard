<script setup lang="ts">
import { ref } from 'vue'

// LiveDock logo. Variants:
//   layout:  full (mark + text on the side) | stacked (mark above text) | icon (mark only)
//   mark:    gradient | mono-dark | mono-light | outline
// `pulse` enables an animated sweep over the mark (used on Login).
// `on-dark` flips text colors when used over dark surfaces.

interface Props {
  layout?: 'full' | 'stacked' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  mark?: 'gradient' | 'mono-dark' | 'mono-light' | 'outline'
  pulse?: boolean
  onDark?: boolean
  /** legacy prop preserved for callers that rendered the inline svg gradient mark */
  withText?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'full',
  size: 'md',
  mark: 'gradient',
  pulse: false,
  onDark: false,
  withText: false,
})

const sizeMap = {
  sm: { box: 32, radius: 8,  icon: 16, title: 14, sub: 8  },
  md: { box: 48, radius: 12, icon: 24, title: 20, sub: 10 },
  lg: { box: 64, radius: 16, icon: 32, title: 26, sub: 11 },
} as const

const s = computed(() => sizeMap[props.size])

const beatKey = ref(0)
const hasHovered = ref(false)

function onLogoHover() {
  hasHovered.value = true
  beatKey.value++
}
</script>

<template>
  <div class="logo" :class="[`logo--${layout}`, { 'logo--on-dark': onDark }]" @mouseenter="onLogoHover">
    <div
      class="logo__mark"
      :class="[`logo__mark--${mark}`, { 'logo__mark--pulse': pulse }]"
      :style="{ width: `${s.box}px`, height: `${s.box}px`, borderRadius: `${s.radius}px` }"
    >
      <svg
        :width="s.icon"
        :height="s.icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="logo__icon"
        :class="{ 'logo__icon--beat': hasHovered }"
      >
        <path
          :key="'logo-ecg-' + beatKey"
          d="M22 12h-4l-3 9L9 3l-3 9H2"
          pathLength="46"
        />
      </svg>
      <span v-if="pulse" class="logo__sweep" aria-hidden="true" />
    </div>

    <div v-if="layout !== 'icon'" class="logo__text">
      <span class="logo__title" :style="{ fontSize: `${s.title}px` }">LiveDock</span>
      <span class="logo__sub" :style="{ fontSize: `${s.sub}px` }">HEALTH DASHBOARD</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);

  &--stacked {
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
  }

  &__mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    transition: box-shadow 0.35s cubic-bezier(0.25, 1, 0.5, 1);

    &--gradient {
      background: linear-gradient(135deg, var(--emerald-400), var(--teal-500), var(--cyan-600));
      box-shadow: 0 8px 24px -8px rgb(16 185 129 / 0.45);
      color: #ffffff;
    }
    &--mono-dark {
      background: var(--slate-900);
      color: #ffffff;
    }
    &--mono-light {
      background: #ffffff;
      border: 1px solid var(--slate-200);
      color: var(--slate-900);
    }
    &--outline {
      background: transparent;
      border: 2px solid var(--slate-900);
      color: var(--slate-900);
    }
  }

  &__icon {
    position: relative;
    z-index: 1;

    path {
      stroke-dasharray: 46;
      stroke-dashoffset: 0;
    }

    &--beat path {
      animation: logo-ecg-beat 0.55s cubic-bezier(0.25, 1, 0.5, 1) both;
    }
  }

  &:hover &__mark {
    box-shadow: 0 8px 32px -6px rgb(16 185 129 / 0.55);
  }

  &__sweep {
    position: absolute;
    top: 0;
    bottom: 0;
    left: -25%;
    right: -25%;
    pointer-events: none;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0) 30%,
      rgba(255, 255, 255, 0.55) 50%,
      rgba(255, 255, 255, 0) 70%,
      transparent 100%
    );
    mix-blend-mode: screen;
    filter: blur(2px);
    animation: logo-sweep 1.6s ease-in-out infinite;
  }

  &__text {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }
  &__title {
    font-weight: 800;
    background: linear-gradient(90deg, #10b981, #0891b2);
    -webkit-background-clip: text;
            background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
  }
  &__sub {
    color: var(--slate-400);
    letter-spacing: 0.16em;
    margin-top: 4px;
  }
  &--on-dark &__title {
    /* keep gradient text on dark surfaces too */
  }
  &--on-dark &__sub { color: var(--slate-400); }
  &--stacked &__text { align-items: center; }
}

@keyframes logo-sweep {
  0%   { transform: translateX(140%); opacity: 0; }
  15%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { transform: translateX(-140%); opacity: 0; }
}

@keyframes logo-ecg-beat {
  0% { stroke-dashoffset: 46; }
  100% { stroke-dashoffset: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .logo__icon--beat path {
    animation: none;
  }
  .logo__sweep {
    animation: none;
  }
}
</style>
