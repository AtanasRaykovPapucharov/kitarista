<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import treblePng from 'src/assets/images/treble.png'

/* ---------- i18n ---------- */

const { t } = useI18n({
  useScope: 'local',
  messages: {
    en: {
      title: 'Guitar Intervals',
      langLabel: 'Language',
      baseNoteLabel: 'Base note',
      columns: {
        name: 'Interval',
        semitones: 'Semitones',
        description: 'Description',
        example: 'Example',
        staffNotation: 'Staff Notation',
        melodic: 'Melodic',
        melodicSub: '(one note at a time)',
        harmonic: 'Harmonic',
        harmonicSub: '(together / double-stop)',
      },
      intervals: {
        unison: {
          name: 'Unison',
          description:
            'Two notes of identical pitch. The foundation reference point for all other intervals.',
          melodic:
            'Play the same note twice in a row — no pitch change, often used for rhythmic emphasis or repeated-note riffs.',
          harmonic:
            'Play the identical note on two different strings simultaneously to reinforce and thicken the tone (true unison doubling).',
        },
        minor2: {
          name: 'Minor 2nd',
          description:
            'The smallest interval in Western music, one semitone. Highly dissonant and tense.',
          melodic:
            'A chromatic step, common in classical, jazz, and metal riffs (e.g. Phrygian-flavored runs) for tension and drama.',
          harmonic:
            'Sounds sharply dissonant when played together; used sparingly for cluster/tension chords or horror-movie style effects.',
        },
        major2: {
          name: 'Major 2nd',
          description:
            'A whole step, two semitones. Mildly dissonant but a core building block of scales and melodies.',
          melodic:
            'The most common melodic step in scale-based lines, e.g. the start of "Happy Birthday" or any stepwise scale run.',
          harmonic:
            'Creates a suspended, open "sus2" quality when combined with other chord tones; mildly tense as a bare dyad.',
        },
        minor3: {
          name: 'Minor 3rd',
          description:
            'Three semitones. Defines the sound of minor chords and gives music a darker, sadder quality.',
          melodic:
            'Common in blues licks and minor-key melodies, giving a mournful, bluesy character when bent or slid into.',
          harmonic:
            'Played together it forms the core of a minor chord/power-chord-with-third — a dark, moody double-stop.',
        },
        major3: {
          name: 'Major 3rd',
          description:
            'Four semitones. Defines the sound of major chords and gives music a bright, happy quality.',
          melodic:
            'Outlines major tonality in melodies and arpeggios; common in country and pop double-stop licks.',
          harmonic:
            'The defining dyad of a major triad — bright, consonant, and widely used in country/rockabilly double-stops.',
        },
        perfect4: {
          name: 'Perfect 4th',
          description:
            'Five semitones. Very consonant, common between adjacent strings on standard-tuned guitar.',
          melodic:
            'Heard in fanfare-like leaps (e.g. "Here Comes the Bride"), quartal riffs, and sus4 resolutions.',
          harmonic:
            'Forms open, ambiguous quartal harmony (neither major nor minor); a staple of funk and modal-jazz voicings.',
        },
        tritone: {
          name: 'Tritone',
          description:
            'Six semitones, exactly half an octave. The most dissonant interval, historically called "the devil\'s interval."',
          melodic:
            'Used for dramatic, unstable leaps in metal riffs and jazz melodic lines (e.g. "The Simpsons" theme opening).',
          harmonic:
            'Extremely tense when sounded together; defines dominant 7th chords and diminished harmony.',
        },
        perfect5: {
          name: 'Perfect 5th',
          description:
            'Seven semitones. Extremely consonant and stable — the basis of the guitar "power chord."',
          melodic:
            'A strong, open leap heard in countless riffs (e.g. the "Star Wars" theme) and bass lines.',
          harmonic:
            'The power chord itself — stable, open, and neither major nor minor, a rock guitar staple.',
        },
        minor6: {
          name: 'Minor 6th',
          description:
            'Eight semitones. A rich, slightly melancholic consonant interval, inversion of the major 3rd.',
          melodic:
            'Gives melodies a wistful, longing leap, common in Latin and classical melodic lines.',
          harmonic:
            'Adds lush, bittersweet color to minor and augmented harmony when voiced as a double-stop.',
        },
        major6: {
          name: 'Major 6th',
          description: 'Nine semitones. Bright and consonant, inversion of the minor 3rd.',
          melodic:
            'A sweet, open leap common in folk and pop melodies (e.g. the opening of "My Bonnie Lies Over the Ocean").',
          harmonic:
            'Adds a warm, jazzy color; frequently used in major 6th chord voicings and country double-stops.',
        },
        minor7: {
          name: 'Minor 7th',
          description:
            'Ten semitones. Bluesy and slightly tense, inversion of the major 2nd; core to dominant and minor 7th chords.',
          melodic: 'Common in blues and funk riffs, giving a soulful pull back toward the root.',
          harmonic:
            'Defines dominant 7th and minor 7th chord color — smooth but harmonically active, wanting resolution.',
        },
        major7: {
          name: 'Major 7th',
          description:
            'Eleven semitones, one semitone below the octave. Lush but tense, inversion of the minor 2nd.',
          melodic:
            'Creates a strong pull upward to the octave; common in jazz melodies reaching for resolution.',
          harmonic:
            'Sophisticated, dreamy tension used in major 7th chord voicings (e.g. jazz and neo-soul comping).',
        },
        octave: {
          name: 'Octave',
          description:
            'Twelve semitones. The same note name at double (or half) the frequency — maximum consonance.',
          melodic:
            'Octave leaps/jumps add drama and range to a melody (e.g. octave riffs in funk and rock, or "Somewhere Over the Rainbow").',
          harmonic:
            'Octave doubling (famously via octave pedals or the classic "octaves" technique) thickens and reinforces a note.',
        },
      },
    },

    bg: {
      title: 'Китарни интервали',
      langLabel: 'Език',
      baseNoteLabel: 'Основна нота',
      columns: {
        name: 'Интервал',
        semitones: 'Полутонове',
        description: 'Описание',
        example: 'Пример',
        staffNotation: 'Нотен запис',
        melodic: 'Мелодично',
        melodicSub: '(по една нота)',
        harmonic: 'Хармонично',
        harmonicSub: '(заедно / двузвук)',
      },
      intervals: {
        unison: {
          name: 'Прима',
          description:
            'Две ноти с еднаква височина. Основната отправна точка за всички останали интервали.',
          melodic:
            'Изсвирете една и съща нота два пъти подред — без промяна на височината, често се използва за ритмично подчертаване или рифове с повтарящи се ноти.',
          harmonic:
            'Изсвирете идентичната нота на две различни струни едновременно, за да усилите и удебелите тона (истинско удвояване в унисон).',
        },
        minor2: {
          name: 'Малка секунда',
          description:
            'Най-малкият интервал в западната музика — един полутон. Силно дисонантен и напрегнат.',
          melodic:
            'Хроматична стъпка, честа в класически, джаз и метъл рифове (напр. пасажи с фригийски привкус) за напрежение и драматизъм.',
          harmonic:
            'Звучи остро дисонантно при едновременно изсвирване; използва се пестеливо за клъстерни/напрегнати акорди или ефекти в стил хорър филми.',
        },
        major2: {
          name: 'Голяма секунда',
          description:
            'Цял тон, два полутона. Леко дисонантен, но основен градивен елемент на гами и мелодии.',
          melodic:
            'Най-честата мелодична стъпка в гамообразни линии, напр. началото на "Happy Birthday" или всяко стъпаловидно движение по гама.',
          harmonic:
            'Създава suspended, отворено "sus2" звучене при комбиниране с други акордови тонове; леко напрегнато като чист двузвук.',
        },
        minor3: {
          name: 'Малка терца',
          description:
            'Три полутона. Определя звученето на минорните акорди и придава на музиката по-тъмен, по-тъжен характер.',
          melodic:
            'Честа в блус лика и мелодии в минорна тоналност, придаваща тъжен, блус характер при бенд или плъзгане към нея.',
          harmonic:
            'Изсвирена едновременно формира ядрото на минорен акорд/пауър акорд с терца — тъмен, настроенчески двузвук.',
        },
        major3: {
          name: 'Голяма терца',
          description:
            'Четири полутона. Определя звученето на мажорните акорди и придава на музиката ярък, весел характер.',
          melodic:
            'Очертава мажорна тоналност в мелодии и арпежи; честа в кънтри и поп лик-ове с двузвуци.',
          harmonic:
            'Определящият двузвук на мажорното трезвучие — ярък, консонантен и широко използван в кънтри/рокабили двузвуци.',
        },
        perfect4: {
          name: 'Чиста кварта',
          description:
            'Пет полутона. Много консонантен, чест между съседни струни при стандартно акордирана китара.',
          melodic:
            'Среща се във фанфарни скокове (напр. "Here Comes the Bride"), квартални рифове и sus4 разрешения.',
          harmonic:
            'Формира отворена, неопределена квартална хармония (нито мажор, нито минор); основен елемент на фънк и модален джаз войсинги.',
        },
        tritone: {
          name: 'Тритон (увеличена кварта)',
          description:
            'Шест полутона, точно половин октава. Най-дисонантният интервал, исторически наричан "дяволският интервал".',
          melodic:
            'Използва се за драматични, нестабилни скокове в метъл рифове и джаз мелодични линии (напр. началото на темата на "Семейство Симпсън").',
          harmonic:
            'Изключително напрегнат при едновременно звучене; определя доминантово-септакордова и умалена хармония.',
        },
        perfect5: {
          name: 'Чиста квинта',
          description:
            'Седем полутона. Изключително консонантен и стабилен — основата на китарния "пауър акорд".',
          melodic:
            'Силен, отворен скок, срещан в безброй рифове (напр. темата на "Star Wars") и баскитари.',
          harmonic:
            'Самият пауър акорд — стабилен, отворен и нито мажорен, нито минорен — основен елемент на рок китарата.',
        },
        minor6: {
          name: 'Малка секста',
          description:
            'Осем полутона. Богат, леко меланхоличен консонантен интервал, обръщение на голямата терца.',
          melodic:
            'Придава на мелодиите носталгичен, копнеещ скок, чест в латино и класически мелодични линии.',
          harmonic:
            'Добавя богат, горчиво-сладък цвят към минорна и увеличена хармония, когато е войсиран като двузвук.',
        },
        major6: {
          name: 'Голяма секста',
          description: 'Девет полутона. Ярък и консонантен, обръщение на малката терца.',
          melodic:
            'Сладък, отворен скок, чест във фолк и поп мелодии (напр. началото на "My Bonnie Lies Over the Ocean").',
          harmonic:
            'Добавя топъл, джазов цвят; често се използва в акорди с голяма секста и кънтри двузвуци.',
        },
        minor7: {
          name: 'Малка септима',
          description:
            'Десет полутона. Блус звучене и леко напрегнато, обръщение на голямата секунда; основен елемент на доминантови и минорни септакорди.',
          melodic: 'Честа в блус и фънк рифове, придаваща душевно привличане обратно към тониката.',
          harmonic:
            'Определя цвета на доминантов септакорд и минорен септакорд — гладко, но хармонично активно, искащо разрешение.',
        },
        major7: {
          name: 'Голяма септима',
          description:
            'Единадесет полутона, един полутон под октавата. Богато, но напрегнато, обръщение на малката секунда.',
          melodic:
            'Създава силно привличане нагоре към октавата; често в джаз мелодии, търсещи разрешение.',
          harmonic:
            'Изтънчено, мечтателно напрежение, използвано във войсинги на голям септакорд (напр. джаз и нео-соул съпровод).',
        },
        octave: {
          name: 'Октава',
          description:
            'Дванадесет полутона. Същото име на нотата при двойна (или половин) честота — максимална консонантност.',
          melodic:
            'Октавни скокове добавят драматизъм и обхват на мелодията (напр. октавни рифове във фънк и рок, или "Somewhere Over the Rainbow").',
          harmonic:
            'Октавното удвояване (известно чрез октавни педали или класическата техника "октави") удебелява и подсилва нотата.',
        },
      },
    },
  },
})

/* ---------- Table columns ---------- */

const columns = computed(() => [
  {
    name: 'name',
    label: t('columns.name'),
    field: 'id',
    align: 'left',
    sortable: true,
  },

  {
    name: 'semitones',
    label: t('columns.semitones'),
    field: 'semitones',
    align: 'center',
    sortable: true,
  },

  {
    name: 'description',
    label: t('columns.description'),
    field: 'semitones',
    align: 'left',
  },

  {
    name: 'notes',
    label: t('columns.example'),
    field: 'semitones',
    align: 'center',
  },

  {
    name: 'staff_notation',
    label: t('columns.staffNotation'),
    field: 'semitones',
    align: 'center',
  },

  {
    name: 'var_melodic',
    label: t('columns.melodic'),
    field: 'semitones',
    align: 'left',
  },

  {
    name: 'var_harmonic',
    label: t('columns.harmonic'),
    field: 'semitones',
    align: 'left',
  },
])

/* ---------- Base note picker ---------- */

const baseOptions = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

const baseNote = ref('C')

const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const targetNoteName = (row) => {
  const baseIdx = sharpNames.indexOf(baseNote.value)

  const idx = (baseIdx + row.semitones) % 12

  return row.accidental === 'b' ? flatNames[idx] : sharpNames[idx]
}

const exampleNotes = (row) => `${baseNote.value} - ${targetNoteName(row)}`

/* ---------- Staff step mapping ---------- */

/*
 * Diatonic staff-step of each natural note.
 *
 * step 0 = bottom line (E)
 * step 8 = top line (F)
 *
 * Treble-clef line order:
 * E-G-B-D-F
 *
 * Space order:
 * F-A-C-E
 */

const baseStepMap = {
  E: 0,
  F: 1,
  G: 2,
  A: 3,
  B: 4,
  C: 5,
  D: 6,
}

/* ---------- Guitar tab helper ---------- */

const rootFret = 3

const noteAtFret = (fret) => {
  const names = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#']

  return names[fret % 12]
}

const makeTab = (semitones) => {
  const root = rootFret

  const target = rootFret + semitones

  const maxFret = Math.max(target, root) + 1

  let line = 'E|'

  for (let f = 0; f <= maxFret; f++) {
    if (f === root && f === target) {
      line += '(' + f + ')'
    } else if (f === root) {
      line += 'R'
    } else if (f === target) {
      line += String(f)
    } else {
      line += '-'
    }

    line += '-'
  }

  line += '|'

  return `${line}
R = root (${noteAtFret(root)})   number = interval note (${noteAtFret(target)})`
}

/* ---------- Interval data ----------
 *
 * Only structural/musical data lives here. Display text (name,
 * description, melodic, harmonic) is looked up from the i18n
 * messages above via `id`, so it stays reactive to `locale`.
 */

const intervals = ref([
  {
    id: 'unison',
    semitones: 0,
    steps: 0,
    accidental: '',
    rootFret,
    tab: makeTab(0),
    __expanded: false,
  },
  {
    id: 'minor2',
    semitones: 1,
    steps: 1,
    accidental: 'b',
    rootFret,
    tab: makeTab(1),
    __expanded: false,
  },
  {
    id: 'major2',
    semitones: 2,
    steps: 1,
    accidental: '',
    rootFret,
    tab: makeTab(2),
    __expanded: false,
  },
  {
    id: 'minor3',
    semitones: 3,
    steps: 2,
    accidental: 'b',
    rootFret,
    tab: makeTab(3),
    __expanded: false,
  },
  {
    id: 'major3',
    semitones: 4,
    steps: 2,
    accidental: '',
    rootFret,
    tab: makeTab(4),
    __expanded: false,
  },
  {
    id: 'perfect4',
    semitones: 5,
    steps: 3,
    accidental: '',
    rootFret,
    tab: makeTab(5),
    __expanded: false,
  },
  {
    id: 'tritone',
    semitones: 6,
    steps: 3,
    accidental: '#',
    rootFret,
    tab: makeTab(6),
    __expanded: false,
  },
  {
    id: 'perfect5',
    semitones: 7,
    steps: 4,
    accidental: '',
    rootFret,
    tab: makeTab(7),
    __expanded: false,
  },
  {
    id: 'minor6',
    semitones: 8,
    steps: 5,
    accidental: 'b',
    rootFret,
    tab: makeTab(8),
    __expanded: false,
  },
  {
    id: 'major6',
    semitones: 9,
    steps: 5,
    accidental: '',
    rootFret,
    tab: makeTab(9),
    __expanded: false,
  },
  {
    id: 'minor7',
    semitones: 10,
    steps: 6,
    accidental: 'b',
    rootFret,
    tab: makeTab(10),
    __expanded: false,
  },
  {
    id: 'major7',
    semitones: 11,
    steps: 6,
    accidental: '',
    rootFret,
    tab: makeTab(11),
    __expanded: false,
  },
  {
    id: 'octave',
    semitones: 12,
    steps: 7,
    accidental: '',
    rootFret,
    tab: makeTab(12),
    __expanded: false,
  },
])

/* ---------- Canvas staff notation ---------- */

/*
 * IMPORTANT:
 * Use Maps keyed by interval id rather than rowIndex (or the
 * locale-dependent name), so refs survive both re-renders and
 * language switches.
 *
 * There are two canvases per interval:
 *
 * 1. The canvas in the normal table row.
 * 2. The canvas in the expanded detail row.
 *
 * Using rowIndex for both means the expanded canvas can overwrite
 * the normal canvas reference.
 */

const canvasEls = ref(new Map())

const expandedCanvasEls = ref(new Map())

const setCanvasRef = (el, id) => {
  if (el) {
    canvasEls.value.set(id, el)
  } else {
    canvasEls.value.delete(id)
  }
}

// const setExpandedCanvasRef = (el, id) => {
//   if (el) {
//     expandedCanvasEls.value.set(id, el)
//   } else {
//     expandedCanvasEls.value.delete(id)
//   }
// }

/* ---------- Staff geometry ---------- */

const baseLineY = 70

const stepSpacing = 5

const trebleClefImg = new Image()
trebleClefImg.src = treblePng
trebleClefImg.onload = () => redrawAll()

const yForStep = (step) => baseLineY - step * stepSpacing

const drawLedgerLines = (ctx, x, step) => {
  if (step <= 8) return

  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1

  for (let s = 10; s <= step; s += 2) {
    const y = yForStep(s)

    ctx.beginPath()

    ctx.moveTo(x - 10, y)

    ctx.lineTo(x + 10, y)

    ctx.stroke()
  }
}

/* ---------- Draw staff ---------- */

const drawStaff = (canvas, row) => {
  if (!canvas) return

  const ctx = canvas.getContext('2d')

  const w = canvas.width

  const h = canvas.height

  ctx.clearRect(0, 0, w, h)

  /* 5 staff lines */

  ctx.strokeStyle = '#333'

  ctx.lineWidth = 1
  ;[0, 2, 4, 6, 8].forEach((step) => {
    const y = yForStep(step)

    ctx.beginPath()

    ctx.moveTo(10, y)

    ctx.lineTo(w - 10, y)

    ctx.stroke()
  })

  /* Treble clef */

  if (trebleClefImg.complete && trebleClefImg.naturalWidth) {
    ctx.drawImage(trebleClefImg, 6, 8, 46, 72)
  }

  /* Note positions */

  const rootStep = baseStepMap[baseNote.value]

  const targetStep = rootStep + row.steps

  const rootX = 95

  const targetX = 185

  const rootY = yForStep(rootStep)

  const targetY = yForStep(targetStep)

  /* Draw half note */

  const drawHalfNote = (x, y, step) => {
    ctx.save()

    ctx.translate(x, y)

    ctx.rotate(-0.35)

    ctx.beginPath()

    ctx.ellipse(0, 0, 6, 4.2, 0, 0, Math.PI * 2)

    ctx.lineWidth = 1.6

    ctx.strokeStyle = '#1a1a2e'

    ctx.stroke()

    ctx.restore()

    /* Stem */

    ctx.beginPath()

    ctx.strokeStyle = '#1a1a2e'

    ctx.lineWidth = 1.4

    if (step <= 4) {
      ctx.moveTo(x + 6, y - 1)

      ctx.lineTo(x + 6, y - 32)
    } else {
      ctx.moveTo(x - 6, y + 1)

      ctx.lineTo(x - 6, y + 32)
    }

    ctx.stroke()
  }

  /* Root note */

  drawHalfNote(rootX, rootY, rootStep)

  /* Ledger lines */

  drawLedgerLines(ctx, targetX, targetStep)

  /* Target note */

  drawHalfNote(targetX, targetY, targetStep)

  /* Accidental */

  if (row.accidental) {
    ctx.font = 'bold 16px sans-serif'

    ctx.fillStyle = '#c0392b'

    const symbol = row.accidental === 'b' ? '\u266D' : '\u266F'

    ctx.fillText(symbol, targetX - 20, targetY + 5)
  }

  /* Note-name labels */

  ctx.font = '11px sans-serif'

  ctx.fillStyle = '#555'

  ctx.textAlign = 'center'

  ctx.fillText(baseNote.value, rootX, h - 8)

  ctx.fillText(targetNoteName(row), targetX, h - 8)

  ctx.textAlign = 'left'
}

/* ---------- Redraw normal table canvases ---------- */

const redrawAll = () => {
  intervals.value.forEach((row) => {
    const canvas = canvasEls.value.get(row.id)

    drawStaff(canvas, row)
  })
}

/* ---------- Redraw expanded canvases ---------- */

const redrawExpanded = () => {
  intervals.value.forEach((row) => {
    if (!row.__expanded) {
      return
    }

    const canvas = expandedCanvasEls.value.get(row.id)

    drawStaff(canvas, row)
  })
}

/* ---------- Base-note change ---------- */

const onBaseNoteChange = async () => {
  await nextTick()

  redrawAll()

  redrawExpanded()
}

/* ---------- Mounted ---------- */

onMounted(async () => {
  await nextTick()

  redrawAll()

  redrawExpanded()
})
</script>

<template>
  <div class="intervals-heading row items-center q-mb-md q-col-gutter-sm">
    <div class="col text-h5">{{ t('title') }}</div>

    <q-space />

    <div class="col-auto">
      <svan class="text-secondary">v1.01</svan>
    </div>
  </div>

  <q-table
    row-key="id"
    :rows="intervals"
    :columns="columns"
    :pagination="{ rowsPerPage: 0 }"
    class="intervals-table bg-grey-2"
    :class="{ 'intervals-table--dark': $q.dark.isActive }"
    hide-pagination
    bordered
    flat
    :grid="$q.screen.lt.sm"
  >
    <template #top>
      <div
        v-if="$q.screen.lt.sm"
        class="intervals-mobile-controls full-width q-pa-sm"
        :class="{ 'intervals-mobile-controls--dark': $q.dark.isActive }"
      >
        <q-select
          v-model="baseNote"
          :options="baseOptions"
          dense
          outlined
          emit-value
          map-options
          dark
          bg-color="grey-10"
          :label="t('baseNoteLabel')"
          @update:model-value="onBaseNoteChange"
        />
      </div>
    </template>

    <template #item="props">
      <q-card
        class="interval-card q-ma-xs full-width"
        :class="{ 'interval-card--dark': $q.dark.isActive }"
        bordered
        flat
      >
        <q-card-section class="interval-card-heading row items-center justify-between q-pb-sm">
          <q-badge color="teal" outline>{{ t(`intervals.${props.row.id}.name`) }}</q-badge>
          <q-chip dense square color="dark" text-color="white">
            {{ props.row.semitones }} st
          </q-chip>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-sm">
          <div class="interval-card-label">{{ t('columns.description') }}</div>
          <div>{{ t(`intervals.${props.row.id}.description`) }}</div>

          <div class="interval-card-label">{{ t('columns.example') }}</div>
          <q-chip dense square color="dark" text-color="white">
            {{ exampleNotes(props.row) }}
          </q-chip>

          <div class="interval-card-label">{{ t('columns.staffNotation') }}</div>
          <div class="staff-content">
            <canvas
              :ref="(el) => setCanvasRef(el, props.row.id)"
              width="260"
              height="100"
              class="staff-canvas"
            />
          </div>

          <div class="interval-card-label">{{ t('columns.melodic') }}</div>
          <div>{{ t(`intervals.${props.row.id}.melodic`) }}</div>

          <div class="interval-card-label">{{ t('columns.harmonic') }}</div>
          <div>{{ t(`intervals.${props.row.id}.harmonic`) }}</div>
        </q-card-section>
      </q-card>
    </template>

    <!-- Custom header: "Example" column header becomes a base-note picker -->
    <template #header-cell-notes="props">
      <q-th :props="props">
        <q-select
          v-model="baseNote"
          :options="baseOptions"
          popup-content-class="bg-grey-9"
          dense
          options-dense
          filled
          emit-value
          map-options
          :label="t('baseNoteLabel')"
          style="min-width: 110px"
          @update:model-value="onBaseNoteChange"
        />
      </q-th>
    </template>
    <template #header-cell-staff_notation="props">
      <q-th :props="props">
        <div class="text-subtitle2 q-mb-xs">
          <q-icon name="piano" size="18px" class="q-mr-xs" />
          {{ props.col.label }}
        </div>
      </q-th>
    </template>
    <template #header-cell-var_melodic="props">
      <q-th :props="props">
        <div class="text-subtitle2 q-mb-xs">
          <q-icon name="trending_up" size="18px" class="q-mr-xs" />
          {{ t('columns.melodic') }} <br />{{ t('columns.melodicSub') }}
        </div>
      </q-th>
    </template>
    <template #header-cell-var_harmonic="props">
      <q-th :props="props">
        <div class="text-subtitle2 q-mb-xs">
          <q-icon name="library_music" size="18px" class="q-mr-xs" />
          {{ t('columns.harmonic') }} <br />{{ t('columns.harmonicSub') }}
        </div>
      </q-th>
    </template>

    <!-- Regular row -->
    <template #body="props">
      <q-tr :props="props">
        <!-- Interval name — using the badge design previously reserved for the BG column -->
        <q-td key="name" :props="props">
          <q-badge color="teal" outline>
            {{ t(`intervals.${props.row.id}.name`) }}
          </q-badge>
        </q-td>

        <q-td key="semitones" :props="props" class="text-center">
          {{ props.row.semitones }}
        </q-td>

        <q-td key="description" :props="props">
          <div class="descr">{{ t(`intervals.${props.row.id}.description`) }}</div>
        </q-td>

        <q-td key="notes" :props="props" class="text-center">
          <q-chip dense square color="dark" text-color="white">
            {{ exampleNotes(props.row) }}
          </q-chip>
        </q-td>

        <!-- Staff notation -->
        <q-td key="staff_notation" :props="props" class="staff-cell">
          <div class="staff-content">
            <canvas
              :ref="(el) => setCanvasRef(el, props.row.id)"
              width="260"
              height="100"
              class="staff-canvas"
            />
          </div>
        </q-td>

        <!-- Variations -->
        <q-td key="var_melodic" :props="props" class="variations-cell">
          <div class="variation-content">
            <p class="q-mb-sm">
              {{ t(`intervals.${props.row.id}.melodic`) }}
            </p>
          </div>
        </q-td>

        <q-td key="var_harmonic" :props="props" class="variations-cell">
          <div class="variation-content">
            <p class="q-mb-none">
              {{ t(`intervals.${props.row.id}.harmonic`) }}
            </p>
          </div>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<style scoped>
.descr {
  width: 200px;
  white-space: pre-wrap;
}

.staff-cell {
  min-width: 285px;
  width: 285px;
  vertical-align: top;
  text-align: center;
}

.staff-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.variations-cell {
  width: 300px;
  vertical-align: top;
  text-align: left;
  white-space: pre-wrap;
}

.variation-content {
  width: 100%;
}

.staff-canvas {
  display: block;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  max-width: 100%;
}

.tab-block {
  font-family: 'Roboto Mono', 'Courier New', monospace;

  background: #1e1e1e;
  color: #d4d4d4;

  padding: 12px;

  border-radius: 6px;

  font-size: 13px;

  line-height: 1.5;

  white-space: pre;

  overflow-x: auto;
}

.intervals-table {
  max-width: 100%;
}

.intervals-table :deep(th),
.intervals-table :deep(td) {
  color: #1f2933;
}

.intervals-table--dark :deep(th),
.intervals-table--dark :deep(td) {
  background: #202327;
  color: #e4e7eb;
  border-color: rgba(255, 255, 255, 0.16);
}

.interval-card {
  background: #e2e5e8;
  color: #1f2933;
}

.interval-card--dark {
  background: #202327;
  color: #e4e7eb;
}

.interval-card-heading {
  min-height: 48px;
}

.interval-card-label {
  color: #53606d;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.intervals-mobile-controls {
  background: #eef1f4;
}

.intervals-mobile-controls--dark {
  background: #17191d;
}

.interval-card--dark .interval-card-label {
  color: #aeb8c4;
}

:deep(.intervals-table th),
:deep(.intervals-table td) {
  border-right: 1px solid rgba(0, 0, 0, 0.16);
  border-bottom: 1px solid rgba(0, 0, 0, 0.16);
}

:deep(.intervals-table .q-table__middle) {
  overflow-x: auto;
}

@media (max-width: 599px) {
  .intervals-heading {
    align-items: flex-start;
  }

  .intervals-heading .text-h5 {
    font-size: 1.35rem;
    line-height: 1.2;
  }

  :deep(.intervals-table table) {
    min-width: 1100px;
  }
}
</style>
