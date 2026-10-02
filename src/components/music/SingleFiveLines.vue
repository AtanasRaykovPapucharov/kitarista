<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import treblePng from 'src/assets/images/treble.png'
import bassPng from 'src/assets/images/bass.png'

const emit = defineEmits(['point', 'select'])
const props = defineProps({
  width: { type: Number, default: 680 },
  height: { type: Number, default: 130 },
  minLines: { type: Number, default: 1 },
  clef: { type: String, default: null }, // 'treble', 'bass'
  beat: { type: String, default: '4/4' },
  sharps: { type: Number, default: 0 },
  flats: { type: Number, default: 0 },
  notes: {
    type: Array,
    default: () => [],
  },
  selected: {
    // { chordIndex, letterIndex } of the currently selected note, or null
    type: Object,
    default: null,
  },
})

const staffCanvas = ref(null)
const ctx = ref(null)
const notesCoordinates = ref([])
// clickable hitboxes mapped back to their source note ({ x, y, chordIndex, letterIndex })
const noteHitboxes = ref([])
const noSharpsAndFlats = computed(() => !props.sharps && !props.flats)
const HIT_RADIUS = 12

// vertical distance between wrapped staff systems
const LINE_HEIGHT = 150

// how many note slots fit before wrapping to a new staff line
const notesPerLine = computed(() => {
  let xInit = !props.clef ? 140 : 175
  if (noSharpsAndFlats.value) xInit -= 77
  const usable = props.width - 40 - xInit
  return Math.max(1, Math.floor(usable / 40) + 1)
})

const totalLines = computed(() => {
  if (!props.notes.length) return props.minLines
  return Math.max(props.minLines, Math.ceil(props.notes.length / notesPerLine.value))
})

const canvasHeight = computed(() => props.height + (totalLines.value - 1) * LINE_HEIGHT)

// number of pennant flags drawn for shorter note durations
const FLAG_COUNTS = { 8: 1, 16: 2, 32: 3, 64: 4 }

function drawNoteFlags(c, stemX, tipY, type, stemUp) {
  const count = FLAG_COUNTS[type]
  if (!count) return

  const dir = stemUp ? 1 : -1
  const spacing = 9 // vertical gap between stacked flags, toward the notehead
  const length = 22 // how far each flag reaches away from its attachment point
  const bulge = 10 // how far the flag curves out from the stem

  c.save()
  c.fillStyle = 'rgba(0, 0, 0, 0.55)'
  for (let i = 0; i < count; i++) {
    const startY = tipY + dir * i * spacing
    const endY = startY + dir * length

    c.beginPath()
    c.moveTo(stemX, startY)
    c.bezierCurveTo(
      stemX + bulge,
      startY + dir * length * 0.15,
      stemX + bulge,
      startY + dir * length * 0.55,
      stemX + 2,
      endY,
    )
    c.bezierCurveTo(
      stemX + bulge * 0.55,
      startY + dir * length * 0.55,
      stemX + bulge * 0.3,
      startY + dir * length * 0.25,
      stemX,
      startY,
    )
    c.closePath()
    c.fill()
  }
  c.restore()
}

const drawNotes = () => {
  const c = ctx.value
  c.fillStyle = '#000'
  noteHitboxes.value = []

  // whole-note fraction filled in the current measure, per the time signature
  const beatParts = props.beat ? props.beat.split('/').map((b) => parseInt(b.trim())) : null
  const measureDuration = beatParts ? beatParts[0] / beatParts[1] : null
  let measureFill = 0

  if (!props.clef || props.clef === 'treble') {
    const perLine = notesPerLine.value
    let xInit = !props.clef ? 140 : 175
    if (noSharpsAndFlats.value) xInit -= 77

    for (let index = 0; index < props.notes.length; index++) {
      const el = props.notes[index]
      const fill = el.type !== 1 && el.type !== 2

      const lineTop = Math.floor(index / perLine) * LINE_HEIGHT
      const localIndex = index % perLine
      const coord = { x: xInit + localIndex * 40, y: 100 }

      c.save()
      c.translate(0, lineTop)

      for (const [letterIndex, n] of el.note.entries()) {
        switch (el.octave) {
          case 'm':
            switch (n) {
              case 'E':
                coord.y = 123
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y - 5)
                c.lineTo(coord.x + 13, coord.y - 5)
                c.stroke()
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y - 15)
                c.lineTo(coord.x + 13, coord.y - 15)
                c.stroke()
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y - 25)
                c.lineTo(coord.x + 13, coord.y - 25)
                c.stroke()
                break
              case 'F':
                coord.y = 118
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y)
                c.lineTo(coord.x + 13, coord.y)
                c.stroke()
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y - 10)
                c.lineTo(coord.x + 13, coord.y - 10)
                c.stroke()
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y - 20)
                c.lineTo(coord.x + 13, coord.y - 20)
                c.stroke()
                break
              case 'G':
                coord.y = 113
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y - 15)
                c.lineTo(coord.x + 13, coord.y - 15)
                c.stroke()
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y - 5)
                c.lineTo(coord.x + 13, coord.y - 5)
                c.stroke()
                break
              case 'A':
                coord.y = 109
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y)
                c.lineTo(coord.x + 13, coord.y)
                c.stroke()
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y - 10)
                c.lineTo(coord.x + 13, coord.y - 10)
                c.stroke()
                break
              case 'B':
                coord.y = 104
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y - 5)
                c.lineTo(coord.x + 13, coord.y - 5)
                c.stroke()
                break

              default:
                break
            }
            if (el.type !== 1) {
              c.beginPath()
              c.moveTo(coord.x + 7, coord.y)
              c.lineTo(coord.x + 7, coord.y - 30)
              c.stroke()
              drawNoteFlags(c, coord.x + 7, coord.y - 30, el.type, true)
            }
            break
          case 1:
            switch (n) {
              case 'C':
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y)
                c.lineTo(coord.x + 13, coord.y)
                c.stroke()
                break
              case 'D':
                coord.y = 94
                break
              case 'E':
                coord.y = 88
                break
              case 'F':
                coord.y = 82
                break
              case 'G':
                coord.y = 76
                break
              case 'A':
                coord.y = 70
                break
              case 'B':
                coord.y = 64
                break

              default:
                break
            }
            if (el.type !== 1) {
              c.beginPath()
              c.moveTo(coord.x + 7, coord.y)
              c.lineTo(coord.x + 7, coord.y - 30)
              c.stroke()
              drawNoteFlags(c, coord.x + 7, coord.y - 30, el.type, true)
            }
            break
          case 2:
            switch (n) {
              case 'C':
                coord.y = 58
                break
              case 'D':
                coord.y = 52
                break
              case 'E':
                coord.y = 46
                break
              case 'F':
                coord.y = 40
                break
              case 'G':
                coord.y = 35
                break
              case 'A':
                coord.y = 30
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y)
                c.lineTo(coord.x + 13, coord.y)
                c.stroke()
                break
              case 'B':
                coord.y = 24
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y + 5)
                c.lineTo(coord.x + 13, coord.y + 5)
                c.stroke()
                break

              default:
                break
            }
            if (el.type !== 1) {
              c.beginPath()
              c.moveTo(coord.x - 7, coord.y)
              c.lineTo(coord.x - 7, coord.y + 30)
              c.stroke()
              drawNoteFlags(c, coord.x - 7, coord.y + 30, el.type, false)
            }
            break
          case 3:
            switch (n) {
              case 'C':
                coord.y = 19
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y)
                c.lineTo(coord.x + 13, coord.y)
                c.stroke()
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y + 10)
                c.lineTo(coord.x + 13, coord.y + 10)
                c.stroke()
                break
              case 'D':
                coord.y = 14
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y + 5)
                c.lineTo(coord.x + 13, coord.y + 5)
                c.stroke()
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y + 15)
                c.lineTo(coord.x + 13, coord.y + 15)
                c.stroke()
                break
              case 'E':
                coord.y = 9
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y)
                c.lineTo(coord.x + 13, coord.y)
                c.stroke()
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y + 10)
                c.lineTo(coord.x + 13, coord.y + 10)
                c.stroke()
                c.beginPath()
                c.moveTo(coord.x - 13, coord.y + 20)
                c.lineTo(coord.x + 13, coord.y + 20)
                c.stroke()
                break
              default:
                break
            }
            if (el.type !== 1) {
              c.beginPath()
              c.moveTo(coord.x - 7, coord.y)
              c.lineTo(coord.x - 7, coord.y + 30)
              c.stroke()
              drawNoteFlags(c, coord.x - 7, coord.y + 30, el.type, false)
            }
            break
        }

        c.beginPath()
        c.ellipse(coord.x, coord.y, 7, 5, 0, 0, Math.PI * 2)
        if (!fill) c.stroke()
        else c.fill()
        notesCoordinates.value.push({ x: coord.x, y: coord.y + lineTop })
        noteHitboxes.value.push({
          x: coord.x,
          y: coord.y + lineTop,
          chordIndex: index,
          letterIndex,
        })

        if (props.selected && props.selected.chordIndex === index) {
          c.save()
          c.strokeStyle = '#e53935'
          c.lineWidth = 2
          c.beginPath()
          c.ellipse(coord.x, coord.y, 11, 9, 0, 0, Math.PI * 2)
          c.stroke()
          c.restore()
        }
      }

      if (measureDuration) {
        measureFill += 1 / el.type
        if (measureFill >= measureDuration - 1e-9) {
          const barX = coord.x + 20
          c.beginPath()
          c.moveTo(barX, 40)
          c.lineTo(barX, 88)
          c.stroke()
          measureFill = 0
        }
      }

      c.restore()
    }
  } else {
    console.log('Base clef: ', props.clef === 'bass')
  }
}

const drawStaff = () => {
  const c = ctx.value
  c.clearRect(0, 0, props.width, canvasHeight.value)
  c.lineWidth = 1
  c.strokeStyle = '#000'

  const spacing = 12

  for (let line = 0; line < totalLines.value; line++) {
    const top = 40 + line * LINE_HEIGHT
    for (let i = 0; i < 5; i++) {
      c.beginPath()
      c.moveTo(20, top + i * spacing)
      c.lineTo(props.width - 20, top + i * spacing)
      c.stroke()
    }
  }
}

const drawTimeSignature = () => {
  if (!props.beat) return

  ctx.value.save()
  ctx.value.fillStyle = 'purp'
  ctx.value.font = '28px Times New Roman'
  ctx.value.textAlign = 'center'

  const beat = props.beat.split('/').map((b) => parseInt(b.trim()))
  const yTop = 62 // numerator position
  const yBottom = 85 // denominator position
  let x = !props.clef ? 110 : 145

  if (noSharpsAndFlats.value) x -= 77

  ctx.value.fillText(beat[0], x, yTop)
  ctx.value.fillText(beat[1], x, yBottom)

  ctx.value.restore()
}

// Sharps & flats
const drawSharps = () => {
  if (!props.sharps) return

  for (let line = 0; line < totalLines.value; line++) {
    const lineTop = line * LINE_HEIGHT

    for (let count = 1; count <= props.sharps; count++) {
      ctx.value.save()
      ctx.value.fillStyle = '#1976d2'
      ctx.value.font = '32px Times New Roman'
      ctx.value.textAlign = 'center'

      let x = !props.clef ? 30 : 65
      let y = 50

      switch (count) {
        case 2:
          x = !props.clef ? 42 : 77
          y = 68
          break
        case 3:
          x = !props.clef ? 56 : 91
          y = 43
          break
        case 4:
          x = !props.clef ? 68 : 103
          y = 62
          break
        case 5:
          x = !props.clef ? 81 : 116
          y = 80
          break
        case 6:
          x = !props.clef ? 92 : 128
          y = 54
          break
      }

      ctx.value.fillText('♯', x, y + lineTop)
      ctx.value.restore()
    }
  }
}

const drawFlats = () => {
  if (!props.flats) return

  for (let line = 0; line < totalLines.value; line++) {
    const lineTop = line * LINE_HEIGHT

    for (let count = 1; count <= props.flats; count++) {
      ctx.value.save()
      ctx.value.fillStyle = '#1976d2'
      ctx.value.font = '32px Times New Roman'
      ctx.value.textAlign = 'center'

      let x = !props.clef ? 28 : 65
      let y = 70

      switch (count) {
        case 2:
          x = !props.clef ? 41 : 78
          y = 51
          break
        case 3:
          x = !props.clef ? 51 : 90
          y = 75
          break
        case 4:
          x = !props.clef ? 65 : 102
          y = 58
          break
        case 5:
          x = !props.clef ? 77 : 114
          y = 82
          break
        case 6:
          x = !props.clef ? 89 : 126
          y = 63
          break
      }

      ctx.value.fillText('♭', x, y + lineTop)
      ctx.value.restore()
    }
  }
}

// clefs
const trebleImg = new Image()
trebleImg.src = treblePng

const bassImg = new Image()
bassImg.src = bassPng

const drawBassClef = () => {
  if (props.clef != 'bass') return

  const c = ctx.value
  if (!bassImg.complete) {
    bassImg.onload = drawBassClef
    return
  }

  const top = 21
  const spacing = 12
  const line4Y = top + spacing * 3

  const imgHeight = 38
  const ratio = bassImg.width / bassImg.height
  const imgWidth = imgHeight * ratio

  for (let line = 0; line < totalLines.value; line++) {
    const lineTop = line * LINE_HEIGHT
    c.drawImage(bassImg, 20, lineTop + line4Y - imgHeight * 0.45, imgWidth, imgHeight)
  }
}

const drawTrebleClef = () => {
  if (props.clef != 'treble') return
  const c = ctx.value
  if (!trebleImg.complete) {
    trebleImg.onload = drawTrebleClef
    return
  }

  const top = 55
  const spacing = 12
  const line2Y = top + spacing

  const imgHeight = 85
  const ratio = trebleImg.width / trebleImg.height
  const imgWidth = imgHeight * ratio

  for (let line = 0; line < totalLines.value; line++) {
    const lineTop = line * LINE_HEIGHT
    c.drawImage(trebleImg, 9, lineTop + line2Y - imgHeight * 0.52, imgWidth, imgHeight)
  }
}

// click point
const canvasPoint = (ev) => {
  const rect = staffCanvas.value.getBoundingClientRect()
  const x = ev.clientX - rect.left
  const y = ev.clientY - rect.top
  emit('point', { x, y })

  let closest = null
  let closestDist = HIT_RADIUS
  for (const box of noteHitboxes.value) {
    const dist = Math.hypot(box.x - x, box.y - y)
    if (dist <= closestDist) {
      closest = box
      closestDist = dist
    }
  }

  emit(
    'select',
    closest ? { chordIndex: closest.chordIndex, letterIndex: closest.letterIndex } : null,
  )
}

// hooks
onMounted(() => {
  ctx.value = staffCanvas.value.getContext('2d')
  base()
})

watch(
  () => props,
  () => {
    base()
  },
  { deep: true },
)

// helpers
function base() {
  drawStaff()
  drawBassClef()
  drawTrebleClef()
  drawSharps()
  drawFlats()
  drawTimeSignature()
  drawNotes()
}
</script>

<template>
  <!-- {{ noSharpsAndFlats }} -->
  <canvas
    ref="staffCanvas"
    :width="width"
    :height="canvasHeight"
    class="border rounded shadow-md"
    @click="canvasPoint"
  />
  <!-- <pre>{{
    notesCoordinates.map((coord, ind) => {
      return {
        ...coord,
        ...notes[ind],
      }
    })
  }}</pre> -->
</template>

<style scoped>
canvas {
  cursor: pointer;
  /* cursor: crosshair; */
  background-color: rgba(245, 245, 220, 0.788);
}
</style>
