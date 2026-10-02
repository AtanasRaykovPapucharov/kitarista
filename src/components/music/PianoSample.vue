<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps({
  purpose: { type: String, default: 'lad' },
  initNote: { type: String, default: 'C' },
  octaves: { type: Number, default: 1 },
  startOctave: { type: Number, default: 4 },
  whiteSelected: { type: Array, default: () => [] },
  blackSelected: { type: Array, default: () => [] },
})

const canvas = ref(null)
const ctx = ref(null)
const startOct = ref(props.startOctave)
const octs = ref(props.octaves)

const keys = ref([])
const notesOrder = computed(() => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const startIndex = notes.indexOf(props.initNote)
  return [...notes.slice(startIndex), ...notes.slice(0, startIndex)]
})

function buildKeys() {
  const blackSet = new Set(notesOrder.value?.filter((n) => n.length > 1))
  keys.value = []
  for (let o = startOct.value; o < startOct.value + octs.value; o++) {
    for (let i = 0; i < 12; i++) {
      const name = notesOrder.value[i]
      keys.value.push({
        note: `${name}${o}`,
        isBlack: blackSet.has(name),
        rect: null,
      })
    }
  }

  if (props.purpose === 'lad') keys.value.push(JSON.parse(JSON.stringify(keys.value[0])))
}

function layoutKeys(width, height) {
  const whiteKeys = keys.value.filter((k) => !k.isBlack)
  const wKey = Math.max(20, width / whiteKeys.length)
  const hKey = height
  let x = 0

  // White keys
  for (const k of keys.value) {
    if (!k.isBlack) {
      k.rect = { x, y: 0, w: wKey, h: hKey }
      x += wKey
    }
  }

  // Black keys
  for (const k of keys.value) {
    if (k.isBlack) {
      const base = k.note.slice(0, -1)
      const octave = k.note.at(-1)
      const semitone = notesOrder.value.indexOf(base)
      let leftMap
      switch (props.initNote) {
        case 'D':
          leftMap = { 1: 'D', 4: 'F', 6: 'G', 8: 'A', 11: 'C' }
          break
        case 'E':
          leftMap = { 2: 'F', 4: 'G', 6: 'A', 9: 'C', 11: 'D' }
          break
        case 'F':
          leftMap = { 1: 'F', 3: 'G', 5: 'A', 8: 'C', 10: 'D' }
          break
        case 'G':
          leftMap = { 1: 'G', 3: 'A', 6: 'C', 8: 'D', 11: 'F' }
          break
        case 'A':
          leftMap = { 1: 'A', 4: 'C', 6: 'D', 9: 'F', 11: 'G' }
          break

        default:
          leftMap = { 1: 'C', 3: 'D', 6: 'F', 8: 'G', 10: 'A' }
          break
      }
      const leftName = leftMap[semitone]
      const leftKey = keys.value.find((k2) => !k2.isBlack && k2.note === `${leftName}${octave}`)
      if (leftKey?.rect) {
        const bw = wKey * 0.6
        const bh = hKey * 0.65
        const bx = leftKey.rect.x + wKey * 0.66 - bw / 2
        k.rect = { x: bx, y: 0, w: bw, h: bh }
      }
    }
  }
}

function draw() {
  if (!ctx.value) return
  const c = ctx.value.canvas
  ctx.value.clearRect(0, 0, c.width, c.height)

  // White keys
  let pressed
  for (const k of keys.value.filter((k) => !k.isBlack)) {
    pressed = props.whiteSelected.includes(k.note)
    ctx.value.fillStyle = pressed ? '#cce4ff' : '#fff'
    ctx.value.fillRect(k.rect.x, 0, k.rect.w, k.rect.h)
    ctx.value.strokeStyle = '#000'
    ctx.value.strokeRect(k.rect.x, 0, k.rect.w, k.rect.h)
    ctx.value.fillStyle = '#000'
    ctx.value.font = '10px sans-serif'
    ctx.value.textAlign = 'center'
    ctx.value.fillText(
      props.purpose !== 'interval' ? k.note[0] : k.note,
      k.rect.x + k.rect.w / 2,
      k.rect.h - 6,
    )
  }

  // Black keys
  for (const k of keys.value.filter((k) => k.isBlack)) {
    pressed = props.blackSelected.includes(k.note)
    ctx.value.fillStyle = pressed ? '#777' : '#000'
    ctx.value.fillRect(k.rect.x, k.rect.y, k.rect.w, k.rect.h)
    ctx.value.strokeStyle = '#000'
    ctx.value.strokeRect(k.rect.x, k.rect.y, k.rect.w, k.rect.h)
  }
}

async function resizeCanvas() {
  await nextTick() // wait for DOM to stabilize
  const el = canvas.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return // skip invisible

  const dpr = window.devicePixelRatio || 1
  el.width = rect.width * dpr
  el.height = rect.height * dpr
  ctx.value = el.getContext('2d')

  // Reset transform before scaling again — fixes InvalidStateError
  ctx.value.setTransform(1, 0, 0, 1, 0, 0)
  ctx.value.scale(dpr, dpr)

  layoutKeys(rect.width, rect.height)
  draw()
}

onMounted(async () => {
  buildKeys()
  await resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
})

watch([() => props.whiteSelected, () => props.blackSelected], () => {
  draw()
})

// watch([startOct, octs], async () => {
//   buildKeys()
//   await resizeCanvas()
// })
</script>

<template>
  <div class="column items-center" style="max-width: 900px; width: 100%">
    <div class="q-pt-md" style="width: 100%">
      <canvas
        ref="canvas"
        style="width: 100%; height: 120px; border-radius: 4px; background: #f6f6f6; display: block"
      />
    </div>
  </div>
</template>

<style scoped>
canvas {
  width: 100%;
  height: 120px;
  touch-action: none;
  user-select: none;
}
</style>
