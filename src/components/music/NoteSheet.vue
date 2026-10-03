<script setup>
import { TouchSwipe, useQuasar } from 'quasar'
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import GuitarGriff from 'src/components/GuitarGriff.vue'
import SingleFiveLines from 'src/components/music/SingleFiveLines.vue'

const $q = useQuasar()
const showNeck = ref(true) // fretboard can be folded away to give the staff more room

/* =====================================================
   SETTINGS DRAWER (phones only)
   On phones the settings panel becomes a right-side drawer.
   It is the same <aside> as on desktop, restyled with CSS,
   so it does not depend on the app's QLayout drawers.
===================================================== */

const vTouchSwipe = TouchSwipe // local directive: swipe right to close
const isMobile = computed(() => $q.screen.lt.sm)
const settingsOpen = ref(false)
const settingsPanel = ref(null)
const settingsButton = ref(null)

function openSettings() {
  settingsOpen.value = true
}

function closeSettings() {
  settingsOpen.value = false
}

function onDrawerKeydown(e) {
  if (e.key === 'Escape') closeSettings()
}

watch(settingsOpen, async (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    window.addEventListener('keydown', onDrawerKeydown)
    await nextTick()
    settingsPanel.value?.focus()
  } else {
    window.removeEventListener('keydown', onDrawerKeydown)
    settingsButton.value?.$el?.focus()
  }
})

// rotating or resizing to a wider screen shows the panel inline again
watch(isMobile, (mobile) => {
  if (!mobile) settingsOpen.value = false
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onDrawerKeydown)
})

/* =====================================================
   SHEET MODEL
===================================================== */

const clone = (v) => JSON.parse(JSON.stringify(v))

function defaultSheet() {
  return {
    width: 730,
    clef: 'treble',
    beat: '4/4',
    sharps: 3,
    flats: 0,
    notes: [
      { note: ['C'], type: 1, octave: 1 },
      // { note: ['G'], type: 4, octave: 2 },
    ],
  }
}

// clef and beat can be null on purpose (hidden on the staff), so a missing
// key falls back to the default but an explicit null is kept
function normalizeSheet(raw) {
  const base = defaultSheet()
  if (!raw || typeof raw !== 'object') return base

  const sharps = Number(raw.sharps) || 0
  return {
    width: Number(raw.width) || base.width,
    clef: 'clef' in raw ? raw.clef : base.clef,
    beat: 'beat' in raw ? raw.beat : base.beat,
    sharps,
    flats: sharps > 0 ? 0 : Number(raw.flats) || 0,
    notes: Array.isArray(raw.notes)
      ? raw.notes.map((n) => ({
          note: Array.isArray(n?.note) ? [...n.note] : [n?.note || 'C'],
          type: n?.type ?? 4,
          octave: n?.octave ?? 1,
        }))
      : [],
  }
}

const sheetName = ref('Untitled sheet')
const addOperState = reactive(defaultSheet())
// last values of clef / beat / key signature, restored when re-enabled
const addOperStateBU = defaultSheet()

const selectedNote = ref(null) // { chordIndex, letterIndex }
const isBass = ref(addOperState.clef === 'bass')
const beatTop = ref(4)
const beatBottom = ref(4)

function syncBeatControls() {
  if (!addOperState.beat) return
  const [top, bottom] = String(addOperState.beat).split('/').map(Number)
  beatTop.value = Number.isFinite(top) ? top : 4
  beatBottom.value = Number.isFinite(bottom) ? bottom : 4
}

function replaceSheet(next) {
  Object.assign(addOperState, normalizeSheet(next))
  isBass.value = addOperState.clef === 'bass'
  syncBeatControls()
  selectedNote.value = null
}

syncBeatControls()

// updates
const updateBeat = (noBeat) => {
  if (noBeat) {
    addOperState.beat = addOperStateBU.beat || `${beatTop.value}/${beatBottom.value}`
    syncBeatControls()
  } else {
    addOperStateBU.beat = addOperState.beat
    addOperState.beat = null
  }
}

const updateSharpsAndFlats = (noSharpsAndFlats) => {
  if (noSharpsAndFlats) {
    addOperState.sharps = addOperStateBU.sharps
    addOperState.flats = addOperStateBU.flats
  } else {
    addOperStateBU.sharps = addOperState.sharps
    addOperStateBU.flats = addOperState.flats
    addOperState.sharps = 0
    addOperState.flats = 0
  }
}

const updateClef = (noClef) => {
  if (noClef) {
    addOperState.clef = isBass.value ? 'bass' : 'treble'
  } else {
    addOperStateBU.clef = addOperState.clef
    addOperState.clef = null
  }
}

/* =====================================================
   IMPORT / EXPORT
===================================================== */

const fileInput = ref(null)

function fileName(ext) {
  const base = (sheetName.value || 'note-sheet').trim().replace(/[^\w\-áéíóúñü ]+/gi, '')
  return `${base.replace(/\s+/g, '-').toLowerCase() || 'note-sheet'}.${ext}`
}

function exportJson() {
  const payload = {
    version: 1,
    name: sheetName.value || 'Untitled sheet',
    ...clone(addOperState),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName('json')
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function importJson(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const raw = JSON.parse(String(reader.result))
      if (!raw || !Array.isArray(raw.notes)) throw new Error('Not a note sheet')
      replaceSheet(raw)
      sheetName.value = raw.name || file.name.replace(/\.json$/i, '') || 'Untitled sheet'
      $q.notify({ type: 'positive', message: 'Sheet imported', position: 'top-left' })
    } catch {
      $q.notify({
        type: 'negative',
        message: 'This file is not a note sheet export. Choose a .json file saved from here.',
        position: 'top-left',
      })
    }
  }
  reader.readAsText(file)
}

function clearAll() {
  $q.dialog({
    title: 'Clear the sheet?',
    message: 'All notes will be removed and the settings reset.',
    cancel: { flat: true, label: 'Cancel' },
    ok: { color: 'negative', label: 'Clear' },
  }).onOk(() => {
    replaceSheet({ ...defaultSheet(), notes: [] })
    sheetName.value = 'Untitled sheet'
  })
}

//===============
// note selection & properties
const noteDraft = reactive({ note: [], type: 4, octave: 1 })

const noteLetterOptions = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const octaveOptions = ['m', 1, 2, 3]
const typeOptions = [
  { label: 'Whole', value: 1 },
  { label: 'Half', value: 2 },
  { label: 'Quarter', value: 4 },
  { label: 'Eighth', value: 8 },
  { label: 'Sixteenth', value: 16 },
  { label: 'Thirty-second', value: 32 },
  { label: 'Sixty-fourth', value: 64 },
]

const selectedGuitarNotes = computed(() => {
  if (!selectedNote.value) return []

  const chord = addOperState.notes[selectedNote.value.chordIndex]
  if (!chord) return []

  return chord.note.map((note) => `${note}${chord.octave ?? 1}`)
})

const selectedGuitarLabel = computed(() => {
  return ''
  // if (!selectedNote.value) return ''

  // const chord = addOperState.notes[selectedNote.value.chordIndex]
  // if (!chord) return ''

  // return `${chord.note.join(', ')} - ${chord.octave}`
})

const onSelectNote = (sel) => {
  selectedNote.value = sel
  const chord = sel ? addOperState.notes[sel.chordIndex] : null
  if (chord) {
    noteDraft.note = [...chord.note]
    noteDraft.type = chord.type
    noteDraft.octave = chord.octave

    // phones: the note fields live in the drawer, so open it on the Notes box
    // (tapping empty staff only deselects and leaves the drawer closed)
    if (isMobile.value) {
      if (settingsPanel.value) settingsPanel.value.scrollTop = 0
      openSettings()
    }
  }
}

const applyNoteProps = () => {
  if (!selectedNote.value || !noteDraft.note.length) return
  const chord = addOperState.notes[selectedNote.value.chordIndex]
  if (!chord) return
  chord.note = [...noteDraft.note]
  chord.type = noteDraft.type
  chord.octave = noteDraft.octave
}

watch(
  () => ({
    note: [...noteDraft.note],
    type: noteDraft.type,
    octave: noteDraft.octave,
  }),
  () => {
    applyNoteProps()
  },
  { deep: true },
)

const addNote = () => {
  addOperState.notes.push({ note: ['C'], type: 4, octave: 1 })
}

const deleteNote = () => {
  if (!selectedNote.value) return
  addOperState.notes.splice(selectedNote.value.chordIndex, 1)
  selectedNote.value = null
}

// watchers
watch(
  () => isBass.value,
  (t) => {
    if (addOperState.clef === null) return
    addOperState.clef = t ? 'bass' : 'treble'
  },
)
watch(
  () => [beatTop.value, beatBottom.value],
  (newVal) => {
    if (addOperState.beat === null) return
    if (newVal[0] && newVal[1]) {
      if (newVal[0] > 1) {
        addOperState.beat = `${beatTop.value}/${beatBottom.value}`
      } else {
        beatTop.value = 2
      }
    }
  },
)
watch(
  () => addOperState.sharps,
  (newVal) => {
    if (newVal > 0) {
      addOperState.flats = 0
      addOperState.sharps = newVal
    }
  },
  { deep: true },
)
watch(
  () => addOperState.flats,
  (newVal) => {
    if (newVal > 0) {
      addOperState.sharps = 0
      addOperState.flats = newVal
      applyNoteProps()
    }
  },
  { deep: true },
)

// helpers
function allowOnlyPositiveDigits(e) {
  if (!/[1-9]/.test(e.key)) e.preventDefault()
}
</script>

<template>
  <div class="ns-page" :class="$q.dark.isActive ? 'ns-dark' : 'ns-light'">
    <!-- ===== Workspace: fretboard + staff ===== -->
    <main class="ns-workspace">
      <!-- phones: sheet name and the button that opens the settings drawer -->
      <div v-if="isMobile" class="ns-mobile-bar">
        <span class="ns-mobile-title">{{ sheetName || 'Untitled sheet' }}</span>
        <q-btn
          ref="settingsButton"
          class="ns-settings-btn"
          color="primary"
          unelevated
          no-caps
          icon="settings"
          :aria-expanded="settingsOpen"
          aria-controls="ns-settings"
          @click="openSettings"
        >
          <q-badge v-if="selectedNote" floating rounded color="positive" aria-hidden="true" />
        </q-btn>
      </div>

      <section class="ns-block">
        <header class="ns-block-head">
          <h2 class="ns-block-title">Fretboard</h2>
          <q-btn
            flat
            dense
            no-caps
            class="ns-quiet"
            :icon="showNeck ? 'expand_less' : 'expand_more'"
            :label="showNeck ? 'Hide' : 'Show'"
            :aria-expanded="showNeck"
            @click="showNeck = !showNeck"
          />
        </header>
        <div v-show="showNeck" class="ns-neck">
          <guitar-griff :scale="selectedGuitarNotes" :label="selectedGuitarLabel" :clear="false" />
        </div>
      </section>

      <section class="ns-block">
        <header class="ns-block-head">
          <h2 class="ns-block-title">Staff</h2>
          <span class="ns-hint">Tap a note to select it</span>
        </header>
        <!-- the staff canvas is never scaled with CSS: its hit-testing uses raw
             pixel offsets, so on narrow screens it scrolls sideways instead -->
        <div class="ns-staff-scroll">
          <SingleFiveLines
            v-bind="addOperState"
            :min-lines="2"
            :selected="selectedNote"
            @select="onSelectNote"
          />
        </div>
      </section>
    </main>

    <!-- ===== Settings: inline panel, or right drawer on phones ===== -->
    <div
      v-if="isMobile"
      class="ns-backdrop"
      :class="{ 'is-open': settingsOpen }"
      aria-hidden="true"
      @click="closeSettings"
    />

    <aside
      id="ns-settings"
      ref="settingsPanel"
      v-touch-swipe.right="closeSettings"
      class="ns-panel"
      :class="{ 'is-drawer': isMobile, 'is-open': settingsOpen }"
      :role="isMobile ? 'dialog' : null"
      :aria-modal="isMobile ? 'true' : null"
      aria-label="Sheet settings"
      :tabindex="isMobile ? -1 : null"
    >
      <header v-if="isMobile" class="ns-drawer-head">
        <h2 class="ns-block-title">Settings</h2>
        <q-btn
          flat
          round
          dense
          class="ns-quiet"
          icon="close"
          aria-label="Close settings"
          @click="closeSettings"
        />
      </header>

      <!-- Sheet -->
      <fieldset class="settings-fieldset">
        <legend>Sheet</legend>
        <div class="ns-sheet-row">
          <q-input
            v-model="sheetName"
            class="ns-sheet-name"
            label="Name"
            filled
            dense
            color="primary"
          >
            <template #append>
              <q-btn
                color="negative"
                flat
                dense
                round
                icon="delete_sweep"
                aria-label="Clear the sheet"
                @click="clearAll"
              >
                <q-tooltip>Clear the sheet</q-tooltip>
              </q-btn>
            </template>
          </q-input>
          <q-btn
            class="ns-action"
            color="primary"
            outline
            no-caps
            icon="upload"
            label="Import"
            @click="fileInput?.click()"
          />
          <q-btn
            class="ns-action"
            color="positive"
            unelevated
            no-caps
            icon="download"
            label="Export"
            @click="exportJson"
          />
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            hidden
            @change="importJson"
          />
        </div>
      </fieldset>

      <!-- Notes -->
      <fieldset class="settings-fieldset">
        <legend>Notes</legend>
        <div class="ns-note-actions">
          <q-btn color="primary" outline no-caps icon="add" label="Add note" @click="addNote" />
          <q-btn
            v-if="selectedNote"
            color="negative"
            outline
            no-caps
            icon="delete"
            label="Delete"
            @click="deleteNote"
          />
        </div>

        <p v-if="!selectedNote" class="ns-empty">
          Select a note on the staff to change its pitch, octave and duration.
        </p>
        <div v-else class="ns-note-fields">
          <q-select
            v-model="noteDraft.note"
            class="ns-pitch"
            label="Pitch"
            :options="noteLetterOptions"
            multiple
            use-chips
            filled
            dense
            options-dense
            color="primary"
          />
          <q-select
            v-model="noteDraft.octave"
            label="Octave"
            :options="octaveOptions"
            filled
            dense
            options-dense
            color="primary"
          />
          <q-select
            v-model="noteDraft.type"
            label="Duration"
            :options="typeOptions"
            emit-value
            map-options
            filled
            dense
            options-dense
            color="primary"
          />
        </div>
      </fieldset>

      <!-- Staff settings -->
      <div class="ns-staff-settings">
        <fieldset class="settings-fieldset" :class="{ 'is-off': !addOperState.clef }">
          <legend>Clef</legend>
          <q-btn
            class="ns-fieldset-toggle"
            round
            unelevated
            size="xs"
            padding="none"
            color="primary"
            :icon="!addOperState.clef ? 'add' : 'clear'"
            :aria-label="!addOperState.clef ? 'Show clef' : 'Hide clef'"
            @click="updateClef(!addOperState.clef)"
          />
          <div class="ns-off-content ns-clef">
            <span>Treble</span>
            <q-toggle
              v-model="isBass"
              color="primary"
              keep-color
              :disable="!addOperState.clef"
              aria-label="Bass clef"
            />
            <span>Bass</span>
          </div>
        </fieldset>

        <fieldset
          class="settings-fieldset"
          :class="{ 'is-off': !addOperState.sharps && !addOperState.flats }"
        >
          <legend>Key signature</legend>
          <q-btn
            class="ns-fieldset-toggle"
            round
            unelevated
            size="xs"
            padding="none"
            color="primary"
            :icon="!addOperState.sharps && !addOperState.flats ? 'add' : 'clear'"
            :aria-label="
              !addOperState.sharps && !addOperState.flats
                ? 'Restore key signature'
                : 'Remove key signature'
            "
            @click="updateSharpsAndFlats(!addOperState.sharps && !addOperState.flats)"
          />
          <div class="ns-off-content ns-pair q-mt-md">
            <q-select
              v-model="addOperState.sharps"
              label="Sharps"
              :options="[1, 2, 3, 4, 5, 6]"
              filled
              dense
              options-dense
              color="primary"
            />
            <q-select
              v-model="addOperState.flats"
              label="Flats"
              :options="[1, 2, 3, 4, 5, 6]"
              filled
              dense
              options-dense
              color="primary"
            />
          </div>
        </fieldset>

        <fieldset class="settings-fieldset" :class="{ 'is-off': !addOperState.beat }">
          <legend>Time signature</legend>
          <q-btn
            class="ns-fieldset-toggle"
            round
            unelevated
            size="xs"
            padding="none"
            color="primary"
            :icon="!addOperState.beat ? 'add' : 'clear'"
            :aria-label="!addOperState.beat ? 'Show time signature' : 'Hide time signature'"
            @click="updateBeat(!addOperState.beat)"
          />
          <div class="ns-off-content ns-pair q-mt-md">
            <q-input
              v-model.number="beatTop"
              label="Beats"
              type="number"
              inputmode="numeric"
              filled
              dense
              color="primary"
              @keypress="allowOnlyPositiveDigits"
            />
            <q-select
              v-model="beatBottom"
              label="Note value"
              :options="[4, 8, 16, 32, 64]"
              filled
              dense
              options-dense
              color="primary"
            />
          </div>
        </fieldset>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* =====================================================
   THEME
   Colours come from the app-wide --app-* variables
   (body.body--light / body.body--dark). The few values
   that have no app variable are set per theme here.
   --q-primary / --q-positive are re-pointed for this page
   only, so every color="primary" control picks up the
   theme accent without per-component bindings.
===================================================== */

.ns-light {
  --ns-accent: #126d79; /* = --app-header-start, 5.4:1 on surface-soft */
  --ns-positive: #17794a;
  --ns-shadow: rgba(23, 52, 77, 0.18);
  --ns-shadow-strong: rgba(23, 52, 77, 0.28);
  --ns-backdrop: rgba(23, 52, 77, 0.35);
}

.ns-dark {
  --ns-accent: #42a5f5;
  --ns-positive: #2b9a5c;
  --ns-shadow: rgba(0, 0, 0, 0.35);
  --ns-shadow-strong: rgba(0, 0, 0, 0.5);
  --ns-backdrop: rgba(4, 12, 26, 0.6);
}

.ns-page {
  --q-primary: var(--ns-accent);
  --q-positive: var(--ns-positive);
  color: var(--app-text);
}

.ns-quiet {
  color: var(--app-muted);
}

/* form fields sit on the fieldset tint, so give them the plain surface */
.ns-page :deep(.q-field--filled .q-field__control) {
  background: var(--app-surface);
  color: var(--app-text);
}

.ns-page :deep(.q-field--filled .q-field__control::after) {
  background: var(--ns-accent);
}

.ns-page :deep(.q-field__label),
.ns-page :deep(.q-field__marginal) {
  color: var(--app-muted);
}

.ns-page :deep(.q-field--highlighted .q-field__label) {
  color: var(--ns-accent);
}

.ns-page :deep(.q-field__native),
.ns-page :deep(.q-field__input) {
  color: var(--app-text);
}

.ns-page :deep(.q-field .q-chip) {
  background: var(--app-surface-raised);
  color: var(--app-text);
}

/* =====================================================
   PAGE LAYOUT
   < 600px    one column, tight padding, full-width buttons
   600-1199   one column, settings below the score
   >= 1200    score left, settings panel right (sticky)
===================================================== */

.ns-page {
  --ns-header: 60px; /* app header height */
  --ns-gap: 16px;
  --ns-pad: 16px;
  --ns-radius: 8px;

  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--ns-gap);
  padding: var(--ns-pad);
  padding-bottom: calc(var(--ns-pad) + env(safe-area-inset-bottom, 0px));
  min-height: calc(100dvh - var(--ns-header));
  align-items: start;
}

.ns-workspace,
.ns-panel {
  width: 100%;
  max-width: 820px;
  margin-inline: auto;
  min-width: 0;
}

@media (min-width: 1200px) {
  .ns-page {
    grid-template-columns: minmax(0, 820px) minmax(340px, 440px);
    justify-content: center;
    gap: 24px;
    padding: 20px 24px;
  }

  .ns-workspace,
  .ns-panel {
    margin-inline: 0;
  }

  /* settings stay in view while the score scrolls */
  .ns-panel {
    position: sticky;
    top: 20px;
    max-height: calc(100dvh - var(--ns-header) - 40px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}

@media (max-width: 599px) {
  .ns-page {
    --ns-gap: 12px;
    --ns-pad: 8px;
  }
}

/* =====================================================
   WORKSPACE
===================================================== */

.ns-workspace {
  display: flex;
  flex-direction: column;
  gap: var(--ns-gap);
}

.ns-block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 36px;
  margin-bottom: 6px;
}

.ns-block-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--app-text);
}

.ns-hint {
  font-size: 0.8rem;
  color: var(--app-muted);
}

.ns-neck {
  min-width: 0;
}

/* GuitarGriff uses 100vw on phones, which ignores the page padding */
.ns-neck :deep(.griff-wrapper) {
  max-width: 100%;
}

.ns-neck :deep(.griff-canvas) {
  border-color: var(--app-border);
  border-radius: 4px;
}

.ns-staff-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  border-radius: var(--ns-radius);
  scrollbar-width: thin;
}

/* the canvas sits flush; display:block removes the inline-gap under it */
.ns-staff-scroll :deep(canvas) {
  display: block;
  border: 1px solid var(--app-border);
  border-radius: var(--ns-radius);
}

/* =====================================================
   SETTINGS PANEL
===================================================== */

.ns-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  background: var(--app-surface);
  box-shadow: 0 1px 3px var(--ns-shadow);
  border: 1px solid var(--app-border);
  border-radius: var(--ns-radius);
}

.settings-fieldset {
  position: relative;
  margin: 0;
  min-width: 0; /* fieldsets default to min-content and overflow grids */
  border: 1px solid var(--app-border);
  border-radius: 6px;
  padding: 12px 10px 10px;
  background: var(--app-surface-soft);
  color: var(--app-text);
}

.settings-fieldset legend {
  padding: 0 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ns-accent);
}

/* add/remove button sits on the top border, opposite the legend */
.ns-fieldset-toggle {
  position: absolute;
  top: -3px;
  right: 7px;
  width: 20px;
  height: 20px;
  min-width: 0;
  min-height: 0;
}

.ns-fieldset-toggle :deep(.q-icon) {
  font-size: 14px;
}

/* invisible 32px hit area, so the small button is still easy to tap */
.ns-fieldset-toggle::after {
  content: '';
  position: absolute;
  inset: -6px;
}

/* a staff element that is switched off */
.settings-fieldset.is-off legend {
  color: var(--app-muted);
}

.is-off .ns-off-content {
  opacity: 0.4;
  pointer-events: none;
}

/* ----- Sheet ----- */

.ns-sheet-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
}

.ns-action {
  min-height: 40px;
}

/* ----- Notes ----- */

.ns-note-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.ns-empty {
  margin: 10px 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--app-muted);
}

.ns-note-fields {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 8px;
  margin-top: 10px;
}

/* ----- Clef, key and time signature ----- */

.ns-staff-settings {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px 10px; /* row gap leaves room for the toggle on the border */
  padding-top: 4px;
}

.ns-clef {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 40px;
  font-size: 0.85rem;
  color: var(--app-muted);
}

.ns-pair {
  display: grid;
  gap: 6px;
}

/* in the narrow desktop side panel, clef takes its own short row */
@media (min-width: 1200px) {
  .ns-staff-settings {
    grid-template-columns: 1fr 1fr;
  }

  .ns-staff-settings > :first-child {
    grid-column: 1 / -1;
  }
}

/* =====================================================
   PHONES
===================================================== */

@media (max-width: 599px) {
  .ns-panel {
    padding: 10px;
    gap: 12px;
  }

  .ns-sheet-row {
    grid-template-columns: 1fr 1fr;
  }

  .ns-sheet-name {
    grid-column: 1 / -1;
  }

  .ns-note-actions > * {
    flex: 1;
  }

  .ns-note-fields {
    grid-template-columns: 1fr 1fr;
  }

  .ns-pitch {
    grid-column: 1 / -1;
  }

  .ns-staff-settings {
    grid-template-columns: 1fr;
  }

  /* side by side is easier to reach with a thumb than stacked */
  .ns-pair {
    grid-template-columns: 1fr 1fr;
  }
}

/* =====================================================
   SETTINGS DRAWER (phones)
   z-index sits above the app header (2000) and below
   Quasar menus and dialogs (6000), so selects still open
===================================================== */

.ns-mobile-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 6px 6px 12px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--ns-radius);
}

.ns-mobile-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: var(--app-text);
}

.ns-settings-btn {
  flex: none;
  min-height: 40px;
}

.ns-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2999;
  background: var(--ns-backdrop);
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.25s ease,
    visibility 0s linear 0.25s;
}

.ns-backdrop.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.25s ease;
}

.ns-panel.is-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 3000;
  width: min(380px, 88vw);
  max-width: none;
  margin: 0;
  padding: 0 12px calc(16px + env(safe-area-inset-bottom, 0px));
  padding-right: calc(12px + env(safe-area-inset-right, 0px));
  border: 0;
  border-left: 1px solid var(--app-border);
  border-radius: 12px 0 0 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
  box-shadow: -8px 0 24px var(--ns-shadow-strong);
  outline: none;

  /* closed: off screen and out of the tab order */
  transform: translateX(100%);
  visibility: hidden;
  transition:
    transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
    visibility 0s linear 0.28s;
}

.ns-panel.is-drawer.is-open {
  transform: none;
  visibility: visible;
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* sticky title row so the close button is always reachable */
.ns-drawer-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 -12px;
  padding: calc(10px + env(safe-area-inset-top, 0px)) 8px 10px 16px;
  background: inherit;
  border-bottom: 1px solid var(--app-border);
}

@media (prefers-reduced-motion: reduce) {
  .ns-backdrop,
  .ns-backdrop.is-open,
  .ns-panel.is-drawer,
  .ns-panel.is-drawer.is-open {
    transition: none;
  }
}
</style>
