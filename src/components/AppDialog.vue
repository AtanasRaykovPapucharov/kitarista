<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  persistent: { type: Boolean, default: false },
  position: { type: String, default: undefined },
  maximized: { type: Boolean, default: false },
  fullWidth: { type: Boolean, default: false },
  width: { type: String, default: 'auto' },
  title: { type: String, default: '' },
  showClose: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'hide'])
const { t } = useI18n({ useScope: 'global' })

const isDialogOpen = ref(props.modelValue)
const isOpen = computed({
  get: () => isDialogOpen.value,
  set: (value) => {
    isDialogOpen.value = value
    emit('update:modelValue', value)
  },
})

watch(
  () => props.modelValue,
  (value) => {
    isDialogOpen.value = value
  },
)

defineExpose({
  show: () => {
    isDialogOpen.value = true
  },
  hide: () => {
    isDialogOpen.value = false
  },
})
</script>

<template>
  <q-dialog
    ref="dialog"
    v-model="isOpen"
    :position="position"
    :persistent="persistent"
    :full-width="fullWidth"
    :maximized="maximized"
    transition-duration="500"
    @hide="$emit('hide')"
  >
    <q-card class="app-dialog bg-grey-10 text-secondary" :style="{ width, minWidth: '320px' }">
      <q-bar class="app-dialog__header">
        <span v-if="title" class="app-dialog__title q-ml-sm">{{ title }}</span>
        <q-btn
          v-if="showClose"
          class="app-dialog__close"
          dense
          flat
          icon="close"
          color="red-5"
          v-close-popup
        >
          <q-tooltip>{{ t('common.actions.close') }}</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section class="app-dialog__content">
        <slot />
      </q-card-section>
      <q-card-actions v-if="$slots.actions" align="right">
        <slot name="actions" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.app-dialog__header {
  position: relative;
  height: 72px;
  background-color: #0e0e0e;
}

.app-dialog__logo {
  width: 120px;
  height: 64px;
  object-fit: contain;
}

.app-dialog__title {
  padding: 0 32px 0 12px;
  color: var(--q-secondary);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-align: right;
}

.app-dialog__close {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
}

.app-dialog__content {
  max-height: 70vh;
  overflow: auto;
}
</style>
