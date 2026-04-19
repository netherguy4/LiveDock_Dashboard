<template>
  <div class="list">
    <div class="list-header" aria-hidden="true">
      <div class="th name">Container</div>
      <div class="th">State</div>
      <div class="th num">CPU</div>
      <div class="th num">Memory</div>
      <div class="th num">Download</div>
      <div class="th num">Upload</div>
      <div class="th actions">Actions</div>
    </div>
    <div
      v-for="c in containers"
      :key="c.id"
      class="row"
      :class="{ active: selectedId === c.id }"
      @click="$emit('select', c.id)"
    >
      <div class="name">
        <div class="dot" :class="stateClass(c.state)" />
        <div class="name-col">
          <div class="primary">{{ c.name }}</div>
          <div class="secondary">{{ c.image }}</div>
        </div>
      </div>
      <div class="state">{{ c.status }}</div>
      <div class="metric num" data-label="CPU">{{ c.stat ? pct(c.stat.cpu) : '—' }}</div>
      <div class="metric num" data-label="Mem">{{ c.stat ? humanBytes(c.stat.mem_used) : '—' }}</div>
      <div class="metric num" data-label="Download">{{ c.stat ? humanBytes(c.stat.net_rx) : '—' }}</div>
      <div class="metric num" data-label="Upload">{{ c.stat ? humanBytes(c.stat.net_tx) : '—' }}</div>
      <div class="actions" @click.stop>
        <button v-if="c.state !== 'running'" @click="act(c, 'start')" title="Start">▶</button>
        <button v-if="c.state === 'running'" @click="act(c, 'restart')" title="Restart">⟳</button>
        <button v-if="c.state === 'running'" @click="act(c, 'stop')" title="Stop" class="danger">■</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ContainerRow } from '~/composables/useApi'
import { humanBytes, pct } from '~/utils/format'

defineProps<{ containers: ContainerRow[]; selectedId?: string | null }>()
const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'action', payload: { id: string; name: string; action: 'start' | 'stop' | 'restart' }): void
}>()

function stateClass(s: string) {
  if (s === 'running') return 'ok'
  if (s === 'restarting' || s === 'created') return 'warn'
  return 'down'
}

function act(c: ContainerRow, action: 'start' | 'stop' | 'restart') {
  emit('action', { id: c.id, name: c.name, action })
}
</script>

<style scoped>
.list { background: #11151c; border: 1px solid #222832; border-radius: 10px; overflow: hidden; }
.list-header, .row {
  display: grid;
  grid-template-columns: 2.5fr 1.5fr 0.8fr 1fr 0.9fr 0.9fr 1.1fr;
  align-items: center;
  padding: 10px 14px;
  gap: 12px;
}
.list-header { border-bottom: 1px solid #222832; font-size: 11px; color: #7a869a; text-transform: uppercase; letter-spacing: 0.05em; }
.row { border-bottom: 1px solid #1a1f29; cursor: pointer; transition: background 0.15s; }
.row:last-child { border-bottom: none; }
.row:hover { background: #151a23; }
.row.active { background: #1a2332; }
.name { display: flex; align-items: center; gap: 10px; min-width: 0; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot.ok { background: #10b981; box-shadow: 0 0 6px #10b98160; }
.dot.warn { background: #f59e0b; }
.dot.down { background: #ef4444; }
.name-col { min-width: 0; }
.primary { color: #e7eaf0; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.secondary { color: #5b6578; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.state { color: #97a0b3; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.num { text-align: right; color: #c7ccd6; font-variant-numeric: tabular-nums; font-size: 13px; }
.th.num { text-align: right; }
.actions { display: flex; gap: 4px; justify-content: flex-end; }
.actions button {
  background: #1a1f29; color: #c7ccd6; border: 1px solid #222832;
  border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 13px;
  min-width: 36px; min-height: 32px;
}
.actions button:hover { background: #222832; color: #e7eaf0; }
.actions button.danger:hover { background: #7f1d1d; border-color: #ef4444; }

@media (max-width: 720px) {
  .list { background: transparent; border: none; display: grid; gap: 10px; overflow: visible; }
  .list-header { display: none; }
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "name    state"
      "m1      m2"
      "m3      m4"
      "actions actions";
    row-gap: 10px;
    column-gap: 12px;
    padding: 14px;
    background: #11151c;
    border: 1px solid #222832;
    border-radius: 10px;
  }
  .row.active { background: #1a2332; border-color: #2a3447; }
  .row:hover { background: #11151c; }
  .row.active:hover { background: #1a2332; }
  .name { grid-area: name; min-width: 0; }
  .primary { font-size: 15px; white-space: normal; word-break: break-word; }
  .secondary { font-size: 12px; white-space: normal; word-break: break-all; }
  .state {
    grid-area: state;
    justify-self: end;
    align-self: start;
    text-align: right;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 999px;
    background: #1a1f29;
    border: 1px solid #222832;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60%;
  }
  .metric {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    gap: 2px;
    font-size: 14px;
  }
  .metric::before {
    content: attr(data-label);
    color: #5b6578;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .row > .metric:nth-of-type(1) { grid-area: m1; }
  .row > .metric:nth-of-type(2) { grid-area: m2; }
  .row > .metric:nth-of-type(3) { grid-area: m3; }
  .row > .metric:nth-of-type(4) { grid-area: m4; }
  .actions {
    grid-area: actions;
    justify-content: stretch;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid #1a1f29;
  }
  .actions button {
    flex: 1;
    padding: 10px 12px;
    font-size: 14px;
    min-height: 40px;
  }
}
</style>
