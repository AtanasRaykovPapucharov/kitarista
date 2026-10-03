<script setup>
import { computed, nextTick, ref } from 'vue'
import { TECHNIQUES, parseChord, parseNotes } from './music'
import ChordDiagram from './ChordDiagram.vue'

const props = defineProps({
  cell: { type: Object, required: true },
  title: { type: String, default: '' },
  chordSet: { type: Array, default: () => [] },
  capo: { type: Number, default: 0 },
  canPaste: { type: Boolean, default: false },
})

const emit = defineEmits(['patch', 'pick', 'preview', 'copy', 'paste', 'clear', 'close', 'move'])

const chordInput = ref(null)

const field = (key) =>
  computed({
    get: () => props.cell[key],
    set: (value) => emit('patch', { [key]: value ?? '' }),
  })

const chord = field('chord')
const notes = field('notes')
const text = field('text')
const stroke = field('stroke')
const silent = field('silent')

const chordUnknown = computed(() => !!chord.value && !parseChord(chord.value))
const invalidNotes = computed(() => parseNotes(notes.value).invalid)

const strokeOptions = [
  { value: 'down', icon: 'south', attrs: { 'aria-label': 'Downstroke' } },
  { value: 'up', icon: 'north', attrs: { 'aria-label': 'Upstroke' } },
]

function toggleTechnique(value) {
  const list = props.cell.techniques || []
  const next = list.includes(value) ? list.filter((t) => t !== value) : [...list, value]
  emit('patch', { techniques: next })
}

function onChordKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    emit('move', e.shiftKey ? -1 : 1)
  }
}

async function focusChord(initial) {
  if (typeof initial === 'string') emit('patch', { chord: initial })
  await nextTick()
  const input = chordInput.value?.$el?.querySelector('input')
  if (!input) return
  input.focus()
  const end = input.value.length
  input.setSelectionRange(end, end)
}

defineExpose({ focusChord })
</script>

<template>
  <div class="beat-editor">
    <div class="row items-center no-wrap q-mb-sm">
      <div class="text-subtitle2 text-grey-3 ellipsis">{{ title }}</div>
      <q-space />
      <q-btn flat dense round size="sm" icon="play_arrow" color="blue-5" @click="emit('preview')">
        <q-tooltip>Hear this beat</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" icon="content_copy" color="grey-5" @click="emit('copy')">
        <q-tooltip>Copy beat</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        size="sm"
        icon="content_paste"
        color="grey-5"
        :disable="!canPaste"
        @click="emit('paste')"
      >
        <q-tooltip>Paste beat</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" icon="backspace" color="grey-5" @click="emit('clear')">
        <q-tooltip>Clear beat</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" icon="close" color="grey-5" @click="emit('close')">
        <q-tooltip>Close</q-tooltip>
      </q-btn>
    </div>

    <div class="row no-wrap q-gutter-x-md items-start">
      <div class="col">
        <q-input
          ref="chordInput"
          v-model="chord"
          label="Chord"
          placeholder="E7b9, Am, F/E"
          dense
          outlined
          color="blue-5"
          :error="chordUnknown"
          error-message="Not a chord I can play, kept as text"
          :hide-bottom-space="true"
          @keydown="onChordKeydown"
        >
          <template #append>
            <q-btn-toggle
              v-model="stroke"
              :options="strokeOptions"
              flat
              dense
              size="sm"
              color="grey-6"
              toggle-color="blue-5"
            />
          </template>
        </q-input>

        <div class="chips q-mt-xs">
          <q-chip
            v-for="c in chordSet"
            :key="c"
            dense
            square
            clickable
            :color="chord === c ? 'blue-5' : 'grey-9'"
            :text-color="chord === c ? 'white' : 'grey-4'"
            @click="emit('pick', chord === c ? '' : c)"
          >
            {{ c }}
          </q-chip>
        </div>
      </div>

      <div class="col-auto diagram">
        <ChordDiagram :chord="chord" :capo="capo" />
      </div>
    </div>

    <div class="chips q-mt-sm">
      <q-chip
        v-for="t in TECHNIQUES"
        :key="t.value"
        dense
        square
        clickable
        :color="cell.techniques?.includes(t.value) ? 'blue-5' : 'grey-9'"
        :text-color="cell.techniques?.includes(t.value) ? 'white' : 'grey-4'"
        @click="toggleTechnique(t.value)"
      >
        {{ t.label }}
      </q-chip>
    </div>

    <div class="row q-col-gutter-sm q-mt-xs">
      <div class="col-12 col-sm-6">
        <q-input
          v-model="notes"
          label="Notes or tab"
          placeholder="E3 G#3  or  3-2 1-0"
          dense
          outlined
          color="blue-5"
          :error="invalidNotes.length > 0"
          :error-message="`Can't read: ${invalidNotes.join(' ')}`"
          hint="Space plays notes in order. Use + to play them together, like 6-0+1-0."
        />
      </div>
      <div class="col-12 col-sm-6">
        <q-input
          v-model="text"
          label="Text"
          placeholder="Lyrics, falseta cue, reminder"
          dense
          outlined
          color="blue-5"
          hint="Shown under the beat"
        />
      </div>
    </div>

    <q-toggle
      v-model="silent"
      label="Mute the click on this beat"
      dense
      size="sm"
      color="blue-5"
      class="q-mt-sm text-grey-4"
    />
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}
.chips :deep(.q-chip) {
  margin: 0;
  font-weight: 500;
}
.diagram {
  min-width: 72px;
  min-height: 88px;
}
</style>
