<template>
  <q-page class="q-pa-lg">
    <div class="page-narrow">
      <h1 class="text-h4 q-mt-md q-mb-sm">{{ t('home.title') }}</h1>
      <p class="text-body1 text-grey-8">{{ t('home.subtitle') }}</p>

      <!-- Pinia example -->
      <div class="row items-center q-gutter-sm q-mt-lg">
        <div class="text-subtitle1 q-mr-md">
          {{ t('home.counter', { count: counter.counter }) }}
        </div>
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="music_note"
          :label="t('home.strum')"
          @click="counter.increment()"
        />
        <q-btn flat no-caps color="primary" :label="t('home.reset')" @click="counter.$reset()" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useCounterStore } from '@/stores/example-store'

const { t } = useI18n()
const counter = useCounterStore()
</script>
