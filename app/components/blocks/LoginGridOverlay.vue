<script setup lang="ts">
// Multi-layer animated grid background for the Login page. Three grid tiers
// (dim base / mid / hot) plus a radial halo and a pinpoint sparkle that all
// track the cursor via CSS custom properties --mx / --my (set on the parent
// element by Login.vue via @mousemove).
//
// All effects are pointer-events: none so they never interfere with the form.
</script>

<template>
  <div class="grid-overlay" aria-hidden="true">
    <!-- dim base grid (always visible, very low opacity) -->
    <div class="grid-overlay__base" />

    <!-- mid tier — broad smooth falloff -->
    <div class="grid-overlay__mid" />

    <!-- ambient long-tail wash -->
    <div class="grid-overlay__wash" />

    <!-- hot tier — bright center -->
    <div class="grid-overlay__hot" />

    <!-- mid emerald halo -->
    <div class="grid-overlay__halo" />

    <!-- warm core -->
    <div class="grid-overlay__core" />

    <!-- pinpoint sparkle -->
    <div class="grid-overlay__spark" />
  </div>
</template>

<style lang="scss" scoped>
.grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;

  &__base,
  &__mid,
  &__hot {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to right, white 1px, transparent 1px),
      linear-gradient(to bottom, white 1px, transparent 1px);
    background-size: 40px 40px;
  }

  &__base {
    opacity: 0.05;
  }

  &__mid {
    opacity: 0.15;
    mix-blend-mode: screen;
    -webkit-mask-image: radial-gradient(
      circle,
      black 0%,
      rgba(0, 0, 0, 0.85) 15%,
      rgba(0, 0, 0, 0.55) 35%,
      rgba(0, 0, 0, 0.28) 55%,
      rgba(0, 0, 0, 0.10) 75%,
      transparent 100%
    );
            mask-image: radial-gradient(
      circle,
      black 0%,
      rgba(0, 0, 0, 0.85) 15%,
      rgba(0, 0, 0, 0.55) 35%,
      rgba(0, 0, 0, 0.28) 55%,
      rgba(0, 0, 0, 0.10) 75%,
      transparent 100%
    );
    -webkit-mask-size: 700px 700px;
            mask-size: 700px 700px;
    -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
    -webkit-mask-position: calc(var(--mx, 50%) - 350px) calc(var(--my, 50%) - 350px);
            mask-position: calc(var(--mx, 50%) - 350px) calc(var(--my, 50%) - 350px);
  }

  &__hot {
    opacity: 0.20;
    mix-blend-mode: screen;
    -webkit-mask-image: radial-gradient(
      circle,
      black 0%,
      rgba(0, 0, 0, 0.6) 25%,
      rgba(0, 0, 0, 0.2) 55%,
      transparent 100%
    );
            mask-image: radial-gradient(
      circle,
      black 0%,
      rgba(0, 0, 0, 0.6) 25%,
      rgba(0, 0, 0, 0.2) 55%,
      transparent 100%
    );
    -webkit-mask-size: 260px 260px;
            mask-size: 260px 260px;
    -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
    -webkit-mask-position: calc(var(--mx, 50%) - 130px) calc(var(--my, 50%) - 130px);
            mask-position: calc(var(--mx, 50%) - 130px) calc(var(--my, 50%) - 130px);
  }

  &__wash,
  &__halo,
  &__core,
  &__spark {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 50%;
    transform: translate(var(--mx, 50%), var(--my, 50%)) translate(-50%, -50%);
    will-change: transform;
  }

  &__wash {
    width: 1100px;
    height: 1100px;
    background: radial-gradient(
      closest-side,
      rgba(34, 211, 238, 0.07) 0%,
      rgba(20, 184, 166, 0.05) 25%,
      rgba(16, 185, 129, 0.03) 50%,
      transparent 80%
    );
  }
  &__halo {
    width: 440px;
    height: 440px;
    background: radial-gradient(
      closest-side,
      rgba(16, 185, 129, 0.18) 0%,
      rgba(20, 184, 166, 0.12) 30%,
      rgba(34, 211, 238, 0.06) 60%,
      transparent 85%
    );
    mix-blend-mode: screen;
    filter: blur(8px);
  }
  &__core {
    width: 140px;
    height: 140px;
    background: radial-gradient(
      closest-side,
      rgba(236, 253, 245, 0.16) 0%,
      rgba(167, 243, 208, 0.10) 35%,
      rgba(94, 234, 212, 0.05) 65%,
      transparent 90%
    );
    mix-blend-mode: screen;
    filter: blur(4px);
  }
  &__spark {
    width: 40px;
    height: 40px;
    background: radial-gradient(
      closest-side,
      rgba(255, 255, 255, 0.18),
      transparent 75%
    );
    mix-blend-mode: screen;
  }
}
</style>
