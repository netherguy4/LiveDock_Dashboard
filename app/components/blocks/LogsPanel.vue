<script setup lang="ts">
// Log viewer used inside LogsDrawer and on ContainerPage. Maintains a
// bounded buffer in useLogsStore and auto-scrolls unless the user scrolled
// up. Each line is colour-coded by detected level.

import { ChevronDown } from 'lucide-vue-next'
import { detectLogLevel } from '~/constants/status'
import { useLogsStore } from '~/stores/logs.store'
import { useContainersStore } from '~/stores/containers.store'
import { useUiStore } from '~/stores/ui.store'

interface Props {
  containerName?: string
}
const props = defineProps<Props>()

const logs = useLogsStore()
const containers = useContainersStore()
const ui = useUiStore()
const scroller = ref<HTMLElement | null>(null)

const target = computed(() =>
  props.containerName ? containers.byName(props.containerName) : null,
)

watchEffect(() => {
  if (target.value) logs.select(target.value.id)
})

const lines = computed(() => logs.activeLines)

watch(lines, async () => {
  if (!ui.logsAutoScroll) return
  await nextTick()
  if (scroller.value) {
    scroller.value.scrollTop = scroller.value.scrollHeight
  }
})

function onScroll() {
  const el = scroller.value
  if (!el) return
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  if (!atBottom && ui.logsAutoScroll) ui.logsAutoScroll = false
}

function jumpToBottom() {
  ui.logsAutoScroll = true
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

function pickContainer(id: string) { logs.select(id) }
</script>

<template>
  <div class="logs">
    <div v-if="!props.containerName" class="logs__bar">
      <select
        class="logs__picker"
        :value="logs.activeId ?? ''"
        @change="pickContainer(($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>Select container…</option>
        <option v-for="c in containers.items" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <label class="logs__autoscroll">
        <input v-model="ui.logsAutoScroll" type="checkbox">
        Auto-scroll
      </label>
    </div>

    <div
      v-if="lines.length"
      ref="scroller"
      class="logs__scroller scrollbar-on-dark"
      @scroll="onScroll"
    >
      <pre
        v-for="(line, i) in lines"
        :key="i"
        class="logs__line"
        :class="`logs__line--${detectLogLevel(line)}`"
      >{{ line }}</pre>
      <div class="logs__cursor">▍</div>
    </div>
    <div v-else class="logs__empty">
      <p>Logs will start streaming as soon as a container is selected.</p>
    </div>

    <button
      v-if="lines.length && !ui.logsAutoScroll"
      type="button"
      class="logs__jump"
      @click="jumpToBottom"
    >
      <ChevronDown :size="14" /> Latest
    </button>
  </div>
</template>

<style lang="scss" scoped>
.logs {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;

  &__bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-bottom: var(--space-3);
  }
  &__picker {
    height: 30px;
    padding: 0 var(--space-2);
    background: var(--slate-900);
    border: 1px solid var(--slate-700);
    border-radius: var(--radius-md);
    color: var(--slate-200);
    font-size: 12px;
  }
  &__autoscroll {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--slate-400);
    font-size: 12px;
    cursor: pointer;
  }

  &__scroller {
    flex: 1 1 auto;
    overflow-y: auto;
    @include scrollbar(8px);
    font-family: $font-stack-mono;
    font-size: var(--fs-mono);
    line-height: 1.6;
    color: var(--slate-200);
  }
  &__line {
    margin: 0;
    padding: 1px 0;
    white-space: pre-wrap;
    word-break: break-all;
    animation: log-enter 150ms $ease-out both;

    &--debug { color: var(--slate-500); }
    &--info  { color: var(--slate-300); }
    &--warn  { color: var(--amber-300); }
    &--error { color: var(--red-300); }
  }
  &__cursor {
    color: var(--emerald-400);
    animation: logs-blink 1s steps(2) infinite;
  }

  &__empty {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--slate-500);
    font-size: var(--fs-label);
  }

  &__jump {
    position: absolute;
    bottom: var(--space-3);
    right: var(--space-3);
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    background: var(--color-card);
    color: var(--color-foreground);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    font-size: var(--fs-small);
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: opacity $transition-base, transform $transition-base;

    &:hover { background: var(--color-accent); }
  }
}

@keyframes logs-blink {
  to { opacity: 0; }
}
@keyframes log-enter {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
