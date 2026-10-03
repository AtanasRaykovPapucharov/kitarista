<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings-store'
import logo from '@/assets/logo.png'

const { t } = useI18n()
const settings = useSettingsStore()
const drawerWidth = 300

const localeOptions = [
  { value: 'bg', label: 'Български' },
  { value: 'en-US', label: 'English' },
  { value: 'zh-CN', label: '中文' },
]

const currentLocaleLabel = computed(
  () => localeOptions.find((l) => l.value === settings.locale)?.label ?? settings.locale,
)

const navItems = [
  // { to: '/', label: 'nav.home', icon: 'home' },
  { to: '/', label: 'nav.guitar', icon: 'fa fa-guitar' },
  { to: '/intervals', label: 'nav.intervals', icon: 'timeline' },
  { to: '/scales', label: 'nav.scales', icon: 'music_note' },
  { to: '/chords', label: 'nav.chords', icon: 'library_music' },
  { to: '/tuner', label: 'nav.tuner', icon: 'tune' },
  // { to: '/flamenco', label: 'nav.flamenco', icon: 'fa fa-guitar' },
  // { to: '/about', label: 'nav.about', icon: 'info' },
]

const leftDrawerOpen = ref(false)

function openLeftDrawer() {
  leftDrawerOpen.value = true
}

function closeLeftDrawer() {
  leftDrawerOpen.value = false
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="app-header text-white">
      <q-toolbar>
        <q-toolbar-title class="app-title">
          <img
            :src="logo"
            alt=""
            role="button"
            tabindex="0"
            :aria-label="t('nav.openMenu')"
            class="app-logo"
            @click="openLeftDrawer"
            @keydown.enter.prevent="openLeftDrawer"
            @keydown.space.prevent="openLeftDrawer"
          />
          <span class="text-h5">{{ t('appName') }}</span>
        </q-toolbar-title>

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

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="drawerWidth">
      <div class="drawer-content">
        <q-list padding>
          <q-item v-for="item in navItems" :key="item.to" clickable :to="item.to" exact>
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>{{ t(item.label) }}</q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <q-btn
      v-if="leftDrawerOpen"
      class="page-drawer-close-button"
      flat
      dense
      round
      size="sm"
      icon="chevron_left"
      color="primary"
      :style="{ left: `${drawerWidth}px` }"
      :aria-label="t('nav.closeMenu')"
      :title="t('nav.closeMenu')"
      @click="closeLeftDrawer"
    />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.app-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-logo {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
  flex: 0 0 auto;
  cursor: pointer;
}

.app-logo:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 3px;
}

.drawer-content {
  min-height: 100%;
}

.page-drawer-close-button {
  position: fixed;
  top: 80px;
  z-index: 3000;
  transform: translateX(-50%);
  border: 1px solid var(--app-border);
  background-color: var(--app-surface-soft);
}
</style>
