<script setup>
import { useQuasar } from 'quasar'
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as Tone from 'tone'

const $q = useQuasar()
const canvas = ref(null)
const ctx = ref(null)
const startOctave = ref(4)
const octaves = ref(2)
const power = ref(true)
let unlocked = false

const keys = ref([])
const NOTES_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function buildKeys() {
  const blackSet = new Set(['C#', 'D#', 'F#', 'G#', 'A#'])
  keys.value = []
  for (let o = startOctave.value; o < startOctave.value + octaves.value; o++) {
    for (let i = 0; i < 12; i++) {
      const name = NOTES_ORDER[i]
      keys.value.push({
        note: `${name}${o}`,
        isBlack: blackSet.has(name),
        pressed: false,
        rect: null,
      })
    }
  }
}

function layoutKeys(width, height) {
  const whiteKeys = keys.value.filter((k) => !k.isBlack)
  const wKey = Math.max(20, width / whiteKeys.length)
  const hKey = height
  let x = 0

  for (const k of keys.value) {
    if (!k.isBlack) {
      k.rect = { x, y: 0, w: wKey, h: hKey }
      x += wKey
    }
  }

  for (const k of keys.value) {
    if (k.isBlack) {
      const base = k.note.slice(0, -1)
      const octave = k.note.at(-1)
      const semitone = NOTES_ORDER.indexOf(base)
      const leftMap = { 1: 'C', 3: 'D', 6: 'F', 8: 'G', 10: 'A' }
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

  // white keys
  for (const k of keys.value.filter((k) => !k.isBlack)) {
    ctx.value.fillStyle = k.pressed ? '#d0e8ff' : '#fff'
    ctx.value.fillRect(k.rect.x, 0, k.rect.w, k.rect.h)
    ctx.value.strokeStyle = '#000'
    ctx.value.strokeRect(k.rect.x, 0, k.rect.w, k.rect.h)
    ctx.value.fillStyle = '#000'
    ctx.value.font = '10px sans-serif'
    ctx.value.textAlign = 'center'
    ctx.value.fillText(k.note, k.rect.x + k.rect.w / 2, k.rect.h - 6)
  }

  // black keys
  for (const k of keys.value.filter((k) => k.isBlack)) {
    ctx.value.fillStyle = k.pressed ? '#444' : '#000'
    ctx.value.fillRect(k.rect.x, k.rect.y, k.rect.w, k.rect.h)
  }
}

async function resizeCanvas() {
  await nextTick()
  const el = canvas.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  const dpr = window.devicePixelRatio || 1
  el.width = rect.width * dpr
  el.height = rect.height * dpr
  ctx.value = el.getContext('2d')

  // ✅ Reset transform before scaling again (prevents InvalidStateError)
  ctx.value.setTransform(1, 0, 0, 1, 0, 0)
  ctx.value.scale(dpr, dpr)

  layoutKeys(rect.width, rect.height)
  draw()
}

// ---- AUDIO ----
async function playNote(note) {
  try {
    if (!unlocked) {
      await Tone.start()
      unlocked = true
    }
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttackRelease(note, '8n')
  } catch (err) {
    console.warn('Tone.js error:', err)
  }
}

// ---- Interactions ----
function pressKey(k) {
  if (!k || !power.value) return
  if (k.pressed) return
  k.pressed = true
  draw()
  playNote(k.note)
}

function releaseKey(k) {
  if (!k || !k.pressed) return
  k.pressed = false
  draw()
}

// ---- Pointer controls ----
const pointerMap = new Map()

function hitTest(x, y) {
  for (const k of [
    ...keys.value.filter((k) => k.isBlack),
    ...keys.value.filter((k) => !k.isBlack),
  ]) {
    const r = k.rect
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return k
  }
  return null
}

function handlePointerDown(e) {
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const k = hitTest(x, y)
  if (k) {
    pointerMap.set(e.pointerId, k)
    pressKey(k)
  }
}

function handlePointerMove(e) {
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const prev = pointerMap.get(e.pointerId)
  const now = hitTest(x, y)
  if (prev !== now) {
    if (prev) releaseKey(prev)
    if (now) {
      pointerMap.set(e.pointerId, now)
      pressKey(now)
    }
  }
}

function handlePointerUp(e) {
  const k = pointerMap.get(e.pointerId)
  if (k) releaseKey(k)
  pointerMap.delete(e.pointerId)
}

function attachListeners() {
  const el = canvas.value
  el.addEventListener('pointerdown', handlePointerDown)
  el.addEventListener('pointermove', handlePointerMove)
  el.addEventListener('pointerup', handlePointerUp)
  el.addEventListener('pointerleave', handlePointerUp)
}

// ---- Lifecycle ----
onMounted(() => {
  buildKeys()
  resizeCanvas()
  attachListeners()
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<template>
  <div class="column items-center" style="max-width: 900px; width: 100%">
    <div class="q-pt-md" style="width: 100%">
      <canvas
        ref="canvas"
        :style="{
          width: '100%',
          height: !$q.screen.lt.sm ? '240px' : '120px',
          borderRadius: '8px',
          background: '#f6f6f6',
          display: 'block',
        }"
      />
    </div>
  </div>
</template>

<style scoped>
canvas {
  width: 100%;
  height: 240px;
  touch-action: none;
  user-select: none;
}
</style>
