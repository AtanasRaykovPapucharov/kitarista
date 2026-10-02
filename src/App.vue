<template>
  <router-view />
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings-store'

// Sync vue-i18n, Quasar's language pack and <html lang> on startup
const settings = useSettingsStore()
settings.setLocale(settings.locale)
</script>
