<script setup lang="ts">
import { ref, computed } from "vue";

// LiveDock logo. Variants:
//   layout:  full (mark + text on the side) | stacked (mark above text) | icon (mark only)
//   mark:    gradient | mono-dark | mono-light | outline
// `pulse` enables an animated sweep over the mark (used on Login).
// `on-dark` flips text colors when used over dark surfaces.

interface Props {
  layout?: "full" | "stacked" | "icon";
  size?: "sm" | "md" | "lg";
  mark?: "gradient" | "mono-dark" | "mono-light" | "outline";
  pulse?: boolean;
  onDark?: boolean;
  /** legacy prop preserved for callers that rendered the inline svg gradient mark */
  withText?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  layout: "full",
  size: "md",
  mark: "gradient",
  pulse: false,
  onDark: false,
  withText: false,
});

const sizeMap = {
  sm: { box: 32, radius: 8, icon: 16, title: 14, sub: 8 },
  md: { box: 48, radius: 12, icon: 24, title: 20, sub: 10 },
  lg: { box: 64, radius: 16, icon: 32, title: 26, sub: 11 },
} as const;

const s = computed(() => sizeMap[props.size]);

const isAnimating = ref(false);

/**
 * Starts the icon animation on hover.
 * If the animation is already running, the repeated trigger is ignored.
 */
const handleMouseEnter = () => {
  if (isAnimating.value) return;
  isAnimating.value = true;
};

/**
 * Resets the animation state after the CSS animation finishes.
 */
const handleAnimationEnd = () => {
  isAnimating.value = false;
};
</script>

<template>
  <div
    class="logo"
    :class="[`logo--${layout}`, { 'logo--on-dark': onDark }]"
    @mouseenter="handleMouseEnter"
  >
    <div
      class="logo__mark"
      :class="[`logo__mark--${mark}`, { 'logo__mark--pulse': pulse }]"
      :style="{
        width: `${s.box}px`,
        height: `${s.box}px`,
        borderRadius: `${s.radius}px`,
      }"
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
      >
        <path
          d="M22 12h-4l-3 9L9 3l-3 9H2"
          pathLength="46"
          class="logo__path"
          :class="{ 'logo__path--animating': isAnimating }"
          @animationend="handleAnimationEnd"
        />
      </svg>
      <span v-if="pulse" class="logo__sweep" aria-hidden="true" />
    </div>

    <div v-if="layout !== 'icon'" class="logo__text">
      <span
        class="logo__title logo__title--shimmer"
        :style="{ fontSize: `${s.title}px` }"
        >LiveDock</span
      >
      <span class="logo__sub" :style="{ fontSize: `${s.sub}px` }"
        >HEALTH DASHBOARD</span
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;

  &--stacked {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  &__mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    transition:
      box-shadow 0.35s cubic-bezier(0.25, 1, 0.5, 1),
      transform 0.3s ease;

    &--gradient {
      background: linear-gradient(135deg, #34d399, #14b8a6, #0891b2);
      box-shadow: 0 8px 24px -8px rgb(16 185 129 / 0.45);
      color: #ffffff;
    }
    &--mono-dark {
      background: #0f172a;
      color: #ffffff;
    }
    &--mono-light {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #0f172a;
    }
    &--outline {
      background: transparent;
      border: 2px solid #0f172a;
      color: #0f172a;
    }
  }

  &__path {
    stroke-dasharray: 46;
    stroke-dashoffset: 0;
     // Smoothly return to 0 if the animation was interrupted (for example, in Safari)
    transition: stroke-dashoffset 0.3s ease;

    &--animating {
      // Animate the path being drawn from 46 to 0
      animation: logo-path-draw 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
  }

  &:hover &__mark {
    box-shadow: 0 8px 32px -6px rgb(16 185 129 / 0.55);
    transform: translateY(-1px);
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
    display: inline-block;
    width: fit-content;
    align-self: flex-start;
    font-weight: 800;
    background: linear-gradient(90deg, #10b981, #0891b2);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;

    &--shimmer {
      background-image: repeating-linear-gradient(
        100deg,
        #10b981 0%,
        #14b8a6 25%,
        #5eead4 50%,
        #0891b2 75%,
        #10b981 100%
      );
      background-size: 200% 100%;
      animation: logo-shimmer 4s linear infinite;
      will-change: background-position;
    }
  }

  &__sub {
    color: #94a3b8;
    letter-spacing: 0.16em;
    margin-top: 4px;
    text-transform: uppercase;
  }

  &--stacked &__text {
    align-items: center;
  }
  &--stacked &__title {
    align-self: center;
  }

  // Adjust text colors when the logo sits on a dark background
  &--on-dark {
    .logo__sub {
      color: #64748b;
    }
    // Invert mono-light when needed on a dark background
    .logo__mark--mono-light {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: white;
    }
  }
}

@keyframes logo-path-draw {
  0% {
    stroke-dashoffset: 46;
  }
  50% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes logo-sweep {
  0% {
    transform: translateX(140%);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    transform: translateX(-140%);
    opacity: 0;
  }
}

@keyframes logo-shimmer {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo__path {
    transition: none;
    stroke-dashoffset: 0;
  }
  .logo__title--shimmer,
  .logo__sweep {
    animation: none;
  }
}
</style>
