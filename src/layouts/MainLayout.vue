<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="app-title">{{ t('appName') }}</q-toolbar-title>

        <q-btn
          flat
          dense
          round
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          :aria-label="$q.dark.isActive ? t('nav.lightMode') : t('nav.darkMode')"
          :title="$q.dark.isActive ? t('nav.lightMode') : t('nav.darkMode')"
          @click="$q.dark.toggle()"
        />

        <q-btn-dropdown
          flat
          no-caps
          icon="translate"
          :label="currentLocaleLabel"
          :aria-label="t('nav.language')"
        >
          <q-list>
            <q-item
              v-for="loc in localeOptions"
              :key="loc.value"
              v-close-popup
              clickable
              :active="settings.locale === loc.value"
              @click="settings.setLocale(loc.value)"
            >
              <q-item-section>{{ loc.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list padding>
        <q-item v-for="item in navItems" :key="item.to" clickable :to="item.to" exact>
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>{{ t(item.label) }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings-store'

const { t } = useI18n()
const settings = useSettingsStore()

const localeOptions = [
  { value: 'bg', label: 'Български' },
  { value: 'en-US', label: 'English' },
]

const currentLocaleLabel = computed(
  () => localeOptions.find((l) => l.value === settings.locale)?.label ?? settings.locale,
)

const navItems = [
  { to: '/', label: 'nav.home', icon: 'home' },
  { to: '/scales', label: 'nav.scales', icon: 'music_note' },
  { to: '/chords', label: 'nav.chords', icon: 'library_music' },
  { to: '/flamenco', label: 'nav.flamenco', icon: 'guitar' },
  { to: '/about', label: 'nav.about', icon: 'info' },
]

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
