import { defineStore } from 'pinia'
import { computed } from 'vue'
import { persisted } from './persist'
import type { AppSettings } from '@/types'

const DEFAULTS: AppSettings = {
  theme: 'light',
  defaultRate: 1,
  autoNext: true,
  dramaContinuous: true,
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = persisted<AppSettings>('settings', DEFAULTS)

  const isDark = computed(() => settings.value.theme === 'dark')

  function applyTheme() {
    document.documentElement.classList.toggle('dark', isDark.value)
    document.documentElement.classList.toggle('light', !isDark.value)
  }

  function toggleTheme() {
    settings.value = { ...settings.value, theme: isDark.value ? 'light' : 'dark' }
    applyTheme()
  }

  function patch(p: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...p }
  }

  return { settings, isDark, applyTheme, toggleTheme, patch }
})
