<script setup>
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import { computed, onBeforeMount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/user'
import { getLocalUser } from 'src/services/storage/local'
// import { TONES } from './constants'
import DialogForm from 'src/components/DialogForm.vue'
import ConfirmForm from 'src/components/forms/ConfirmForm.vue'
import GuitarGriff from 'src/components/guitar/GuitarGriff.vue'
import SingleFiveLines from 'src/components/music/SingleFiveLines.vue'

const $q = useQuasar()
const userStore = useUserStore()
const router = useRouter()
const splitterModel = ref(820)
const splitterInnerModel = ref(50)
const isBass = ref(false)
const beatTop = ref(4)
const beatBottom = ref(4)
const addOperState = reactive({
  width: 730,
  clef: 'treble',
  beat: '4/4',
  sharps: 3,
  flats: 0,
  notes: [
    { note: ['C'], type: 1, octave: 1 },
    { note: ['G'], type: 4, octave: 2 },
  ],
})
const addOperStateBU = {
  width: 730,
  clef: 'treble',
  beat: '4/4',
  sharps: 3,
  flats: 0,
  notes: [
    { note: ['C'], type: 1, octave: 1 },
    { note: ['G'], type: 4, octave: 2 },
  ],
}

onBeforeMount(() => {
  const localUser = getLocalUser()
  const isAuthenticated = userStore.user.isAuthenticated || Boolean(localUser?.uid || localUser?.id)

  if (!isAuthenticated) {
    void router.replace('/guitar-scales').then(() => {
      window.dispatchEvent(new CustomEvent('cryptool:open-auth'))
    })
  }
})

// updates
const updateBeat = (noBeat) => {
  if (noBeat) {
    addOperState.beat = addOperStateBU.beat
  } else {
    addOperStateBU.beat = JSON.parse(JSON.stringify(addOperState.beat))
    addOperState.beat = null
  }
}

const updateSharpsAndFlats = (noSharpsAndFlats) => {
  if (noSharpsAndFlats) {
    addOperState.sharps = addOperStateBU.sharps
    addOperState.flats = addOperStateBU.flats
  } else {
    const currVal = JSON.parse(JSON.stringify(addOperState))
    addOperStateBU.sharps = currVal.sharps
    addOperStateBU.flats = currVal.flats
    addOperState.sharps = 0
    addOperState.flats = 0
  }
}

const updateClef = (noClef) => {
  if (noClef) {
    addOperState.clef = addOperStateBU.clef
  } else {
    addOperStateBU.clef = JSON.parse(JSON.stringify(addOperState.clef))
    addOperState.clef = null
  }
}

const sheetName = ref('Untitled sheet')
const sheetList = ref([])
const selectedSheetId = ref(null)
const loadedSheetSnapshot = ref(null)
const isApplyingSheet = ref(false)
const ignoreNextSheetChange = ref(false)

const normalizeLoadedState = (state = {}) => ({
  width: Number(state.width ?? 730),
  clef: state.clef ?? 'treble',
  beat: state.beat ?? '4/4',
  sharps: Number(state.sharps ?? 0),
  flats: Number(state.flats ?? 0),
  notes: Array.isArray(state.notes)
    ? state.notes.map((note) => ({
        note: Array.isArray(note.note) ? [...note.note] : [note.note || 'C'],
        type: note.type ?? 4,
        octave: note.octave ?? 1,
      }))
    : [],
})

const serializeSheet = () => ({
  width: addOperState.width,
  clef: addOperState.clef,
  beat: addOperState.beat,
  sharps: addOperState.sharps,
  flats: addOperState.flats,
  notes: JSON.parse(JSON.stringify(addOperState.notes)),
})

const getSheetSnapshot = () =>
  JSON.stringify({
    name: sheetName.value || 'Untitled sheet',
    ...serializeSheet(),
  })

const confirmSheetAction = (title, message, ok) =>
  new Promise((resolve) => {
    $q.dialog({
      component: DialogForm,
      componentProps: {
        component: ConfirmForm,
        modelValue: { message },
        title,
        ok,
        cancel: 'Cancel',
        close: true,
        persistent: true,
        width: '380px',
      },
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false))
  })

const syncBeatControls = () => {
  const [top, bottom] = String(addOperState.beat || '4/4')
    .split('/')
    .map((part) => Number(part))
  beatTop.value = Number.isFinite(top) ? top : 4
  beatBottom.value = Number.isFinite(bottom) ? bottom : 4
}

const loadSheetState = (state) => {
  const nextState = normalizeLoadedState(state)
  Object.assign(addOperState, nextState)
  isBass.value = addOperState.clef === 'bass'
  syncBeatControls()
}

const applySelectedSheet = (sheet) => {
  isApplyingSheet.value = true
  sheetName.value = sheet.label
  loadSheetState(sheet.data || {})
  loadedSheetSnapshot.value = getSheetSnapshot()
  isApplyingSheet.value = false
}

const fetchSheetList = async () => {
  const uid = userStore.user?.uid
  if (!uid) return

  try {
    const { data } = await api.get('/music-note-sheet', { headers: { 'x-uid': uid } })
    sheetList.value = (data?.data || []).map((sheet) => ({
      label: sheet.name || 'Untitled sheet',
      value: String(sheet.id),
      data: sheet,
    }))

    if (!selectedSheetId.value && sheetList.value.length) {
      selectedSheetId.value = sheetList.value[0].value
    }
  } catch (err) {
    console.error('Failed to fetch music note sheets', err)
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to load saved sheets',
      position: 'top-left',
    })
  }
}

const saveSheet = async ({
  targetSheetId = selectedSheetId.value,
  skipConfirmation = false,
} = {}) => {
  const uid = userStore.user?.uid
  if (!uid) return false

  if (!skipConfirmation) {
    const confirmed = await confirmSheetAction(
      targetSheetId ? 'Save changes?' : 'Save sheet?',
      targetSheetId
        ? `Overwrite "${sheetName.value || 'Untitled sheet'}" with the current notes?`
        : `Save the current notes as "${sheetName.value || 'Untitled sheet'}"?`,
      'Save',
    )

    if (!confirmed) return false
  }

  const payload = {
    name: sheetName.value || 'Untitled sheet',
    ...serializeSheet(),
  }

  try {
    if (targetSheetId) {
      const { data } = await api.put(`/music-note-sheet/${targetSheetId}`, payload, {
        headers: { 'x-uid': uid },
      })
      sheetName.value = data?.data?.name || sheetName.value
      $q.notify({ type: 'positive', message: 'Sheet updated', position: 'top-left' })
    } else {
      const { data } = await api.post('/music-note-sheet', payload, { headers: { 'x-uid': uid } })
      selectedSheetId.value = data?.data?.id ? String(data.data.id) : null
      sheetName.value = data?.data?.name || sheetName.value
      $q.notify({ type: 'positive', message: 'Sheet saved', position: 'top-left' })
    }
    await fetchSheetList()
    loadedSheetSnapshot.value = getSheetSnapshot()
    return true
  } catch (err) {
    console.error('Failed to save music note sheet', err)
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to save sheet',
      position: 'top-left',
    })
    return false
  }
}

// const loadSelectedSheet = async () => {
//   const selected = sheetList.value.find((sheet) => sheet.value === String(selectedSheetId.value))
//   if (!selected) {
//     $q.notify({ type: 'warning', message: 'Select a saved sheet to load' })
//     return
//   }
//   applySelectedSheet(selected)
//   $q.notify({ type: 'positive', message: 'Sheet loaded' })
// }

const deleteSelectedSheet = async () => {
  const confirmed = await confirmSheetAction(
    'Delete sheet?',
    'Are you sure you want to delete the selected sheet?',
    'Delete',
  )

  if (!confirmed) return
  if (!selectedSheetId.value) return
  const uid = userStore.user?.uid
  if (!uid) return

  try {
    await api.delete(`/music-note-sheet/${selectedSheetId.value}`, { headers: { 'x-uid': uid } })
    selectedSheetId.value = null
    sheetName.value = 'Untitled sheet'
    loadedSheetSnapshot.value = null
    await fetchSheetList()
    $q.notify({ type: 'positive', message: 'Sheet deleted', position: 'top-left' })
  } catch (err) {
    console.error('Failed to delete music note sheet', err)
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to delete sheet',
      position: 'top-left',
    })
  }
}

onMounted(() => {
  fetchSheetList()
})

watch(selectedSheetId, async (nextSheetId, previousSheetId) => {
  if (ignoreNextSheetChange.value) {
    ignoreNextSheetChange.value = false
    return
  }

  if (isApplyingSheet.value || !nextSheetId || nextSheetId === previousSheetId) return

  const selected = sheetList.value.find((sheet) => sheet.value === String(nextSheetId))
  if (!selected) return

  const hasUnsavedChanges =
    loadedSheetSnapshot.value && getSheetSnapshot() !== loadedSheetSnapshot.value
  if (hasUnsavedChanges) {
    const shouldSave = await confirmSheetAction(
      'Save changes?',
      'Save changes before loading the selected sheet?',
      'Save',
    )

    if (shouldSave) {
      const saved = await saveSheet({ targetSheetId: previousSheetId, skipConfirmation: true })
      if (!saved) {
        ignoreNextSheetChange.value = true
        selectedSheetId.value = previousSheetId
        return
      }
    }
  }

  applySelectedSheet(selected)
  $q.notify({ type: 'positive', message: 'Sheet loaded', position: 'top-left' })
})

//===============
// note selection & properties
const selectedNote = ref(null) // { chordIndex, letterIndex }
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
    addOperState.clef = t ? 'bass' : 'treble'
  },
)
watch(
  () => [beatTop.value, beatBottom.value],
  (newVal) => {
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
  <q-splitter
    v-model="splitterModel"
    unit="px"
    :limits="[820, 850]"
    :style="{ height: `${$q.screen.height - 60}px` }"
  >
    <template #before>
      <div class="q-px-md" style="height: 100%">
        <q-splitter v-model="splitterInnerModel" horizontal :limits="[1, 50]" style="height: 100%">
          <template #before>
            <div>
              <guitar-griff
                :scale="selectedGuitarNotes"
                :label="selectedGuitarLabel"
                :clear="false"
                style="display: block; max-width: 770px; margin-left: -2px"
              />
            </div>
          </template>

          <template #after>
            <div class="col q-px-lg q-ml-sm">
              <span class="text-caption text-grey-4"> Click a note to select it </span>
              <SingleFiveLines
                v-bind="addOperState"
                :min-lines="2"
                :selected="selectedNote"
                @select="onSelectNote"
              />
            </div>
          </template>
        </q-splitter>
      </div>
    </template>

    <template #after>
      <div class="col q-px-md">
        <q-card class="my-card bg-grey-10" flat bordered style="max-width: auto; margin-top: -10px">
          <q-card-section>
            <div class="row q-mb-sm" style="width: 100%">
              <fieldset class="col settings-fieldset">
                <legend class="text-blue-5">&nbsp;Sheet&nbsp;</legend>
                <div class="row q-gutter-sm">
                  <q-input
                    v-model="sheetName"
                    label="Name"
                    filled
                    dense
                    dark
                    color="blue-5"
                    class="q-mb-sm"
                  >
                    <template #append>
                      <q-btn
                        color="negative"
                        flat
                        dense
                        icon="delete"
                        @click="deleteSelectedSheet"
                      />
                    </template>
                  </q-input>
                  <q-select
                    v-model="selectedSheetId"
                    :options="sheetList"
                    label="List"
                    emit-value
                    map-options
                    filled
                    dense
                    dark
                    color="blue-5"
                    class="q-mb-sm q-ml-sm"
                  />
                  <q-space />
                  <q-btn
                    color="positive"
                    icon="save"
                    label="Save"
                    @click="saveSheet"
                    style="max-height: 40px"
                  />
                </div>
              </fieldset>
            </div>

            <div class="row" style="width: 100%">
              <fieldset class="col settings-fieldset">
                <legend class="text-blue-5">&nbsp;Notes&nbsp;</legend>
                <div v-if="!selectedNote" class="row text-caption text-grey-8">
                  <q-btn color="blue-5" outline label="Add" icon="add" @click="addNote" />
                </div>
                <template v-else>
                  <div class="row q-gutter-sm">
                    <q-btn color="blue-5" outline label="Add" icon="add" @click="addNote" />
                    <q-space />
                    <q-btn
                      color="negative"
                      outline
                      label="Delete"
                      icon="delete"
                      @click="deleteNote"
                    />
                  </div>
                  <div class="row q-gutter-sm q-mt-sm">
                    <q-select
                      v-model="noteDraft.note"
                      label="Pitch"
                      class="col"
                      :options="noteLetterOptions"
                      multiple
                      use-chips
                      filled
                      dense
                      dark
                      options-dense
                      color="primary"
                    />
                    <q-select
                      v-model="noteDraft.octave"
                      label="Octave"
                      class="col"
                      :options="octaveOptions"
                      filled
                      dense
                      dark
                      options-dense
                      color="blue-5"
                    />
                    <q-select
                      class="col"
                      v-model="noteDraft.type"
                      label="Duration"
                      :options="typeOptions"
                      emit-value
                      map-options
                      filled
                      dense
                      dark
                      options-dense
                      color="blue-5"
                    />
                  </div>
                </template>
              </fieldset>
            </div>

            <div class="row q-mt-sm" style="width: 100%">
              <!-- <fieldset class="col settings-fieldset" style="max-width: 230px">
                <legend class="text-primary">&nbsp;Sheet&nbsp;</legend>
                <q-input
                  v-model="sheetName"
                  label="Sheet name"
                  filled
                  dense
                  dark
                  color="primary"
                  class="q-mb-sm"
                />
                <q-select
                  v-model="selectedSheetId"
                  :options="sheetList"
                  label="Saved sheets"
                  emit-value
                  map-options
                  filled
                  dense
                  dark
                  color="primary"
                  clearable
                  class="q-mb-sm"
                />
                <div class="row q-gutter-sm">
                  <q-btn color="primary" dense icon="save" label="Save" @click="saveSheet" />
                  <q-btn
                    color="secondary"
                    outline
                    dense
                    icon="download"
                    label="Load"
                    @click="loadSelectedSheet"
                  />
                  <q-btn
                    color="negative"
                    outline
                    dense
                    icon="delete"
                    label="Delete"
                    @click="deleteSelectedSheet"
                  />
                </div>
              </fieldset> -->
              <!-- <fieldset class="col settings-fieldset" style="max-width: 175px">
                <div style="position: relative">
                  <legend class="text-blue-5">&nbsp;Clef&nbsp;</legend>
                  <span class="text-grey-4">treble</span>
                  <q-toggle v-model="isBass" color="blue-5" keep-color />
                  <span class="text-grey-4">bass</span>
                  <q-btn
                    dense
                    round
                    size="xs"
                    color="blue-5"
                    :icon="!addOperState.clef ? 'add' : 'clear'"
                    class="q-ml-sm"
                    style="position: absolute; top: 10px; right: -4px; max-height: 5px"
                    @click="updateClef(!addOperState.clef)"
                  />
                </div>
              </fieldset> -->

              <fieldset class="col settings-fieldset" style="max-width: 175px">
                <legend class="text-blue-5">&nbsp;Clef&nbsp;</legend>
                <div class="row">
                  <div style="min-width: 125px">
                    <span class="text-grey-4">treble</span>
                    <q-toggle v-model="isBass" color="blue-5" keep-color />
                    <span class="text-grey-4">bass</span>
                  </div>
                  <div style="position: relative">
                    <q-btn
                      dense
                      round
                      size="xs"
                      color="blue-5"
                      :icon="!addOperState.clef ? 'add' : 'clear'"
                      class="q-ml-sm"
                      style="position: absolute; top: -10px; right: -24px; max-height: 5px"
                      @click="updateClef(!addOperState.clef)"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset class="col settings-fieldset" style="max-width: 175px">
                <legend class="text-blue-5">&nbsp;Sharps & Flats&nbsp;</legend>
                <div class="row">
                  <div style="min-width: 125px">
                    <q-select
                      v-model="addOperState.sharps"
                      label="Sharps"
                      :options="[1, 2, 3, 4, 5, 6]"
                      filled
                      dense
                      dark
                      options-dense
                      color="blue-5"
                    />
                    <q-select
                      v-model="addOperState.flats"
                      class="q-mt-xs"
                      label="Flats"
                      :options="[1, 2, 3, 4, 5, 6]"
                      filled
                      dense
                      dark
                      options-dense
                      color="blue-5"
                    />
                  </div>
                  <div style="position: relative">
                    <q-btn
                      dense
                      dark
                      round
                      size="xs"
                      color="blue-5"
                      :icon="!addOperState.sharps && !addOperState.flats ? 'add' : 'clear'"
                      class="q-ml-sm"
                      style="position: absolute; top: -10px; right: -24px; max-height: 5px"
                      @click="updateSharpsAndFlats(!addOperState.sharps && !addOperState.flats)"
                    />
                  </div>
                </div>
              </fieldset>
              <fieldset class="col settings-fieldset" style="max-width: 175px">
                <legend class="text-blue-5">&nbsp;Time signature&nbsp;</legend>
                <div class="row">
                  <div style="max-width: 125px">
                    <q-input
                      v-model.number="beatTop"
                      label="Note beats"
                      type="number"
                      @keypress="allowOnlyPositiveDigits"
                      filled
                      dense
                      dark
                      color="blue-5"
                    />
                    <q-select
                      v-model="beatBottom"
                      class="q-mt-xs"
                      label="Note type"
                      :options="[4, 8, 16, 32, 64]"
                      filled
                      dense
                      dark
                      options-dense
                      color="blue-5"
                    />
                  </div>
                  <div style="position: relative">
                    <q-btn
                      dense
                      round
                      dark
                      size="xs"
                      color="blue-5"
                      :icon="!addOperState.beat ? 'add' : 'clear'"
                      class="q-ml-sm"
                      style="position: absolute; top: -10px; right: -24px; max-height: 5px"
                      @click="updateBeat(!addOperState.beat)"
                    />
                  </div>
                </div>
              </fieldset>
            </div>
          </q-card-section>
        </q-card>
        <!-- <pre>{{ addOperState }}</pre> -->
      </div>
    </template>
  </q-splitter>
</template>

<style scoped>
.settings-panel :deep(.q-field--filled .q-field__control) {
  background: rgba(255, 255, 255, 0.04);
  color: #e0e0e0;
}

.settings-panel :deep(.q-field--filled .q-field__control:focus-within) {
  box-shadow: 0 0 0 1px rgba(66, 133, 244, 0.9);
}

.settings-panel :deep(.q-field__label) {
  color: rgba(255, 255, 255, 0.7) !important;
}

.settings-panel :deep(.q-field__native) {
  color: #f5f5f5;
}

.settings-panel :deep(.q-icon) {
  color: rgba(96, 102, 109, 0.8);
}

.settings-fieldset {
  border: 1px solid rgba(96, 102, 109, 0.8);
  border-radius: 6px;
  padding: 10px 8px 8px;
  background: rgba(255, 255, 255, 0.02);
  color: #f5f5f5;
}

.settings-fieldset legend {
  padding: 0 6px;
  font-weight: 600;
  color: rgba(96, 102, 109, 0.8);
}
</style>
