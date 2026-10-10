import { defineStore } from 'pinia'
import { computed } from 'vue'
import { persisted } from './persist'
import { DEFAULT_SOURCES, type VodSource } from '@/api/sources'

export const useSourcesStore = defineStore('sources', () => {
  const disabledIds = persisted<string[]>('disabled-sources', [])
  const customSources = persisted<VodSource[]>('custom-sources', [])

  const allSources = computed<VodSource[]>(() => [
    ...DEFAULT_SOURCES,
    ...customSources.value.map((s) => ({ ...s, custom: true })),
  ])

  const enabledSources = computed<VodSource[]>(() =>
    allSources.value.filter((s) => !disabledIds.value.includes(s.id)),
  )

  function toggle(id: string) {
    disabledIds.value = disabledIds.value.includes(id)
      ? disabledIds.value.filter((x) => x !== id)
      : [...disabledIds.value, id]
  }

  function isEnabled(id: string) {
    return !disabledIds.value.includes(id)
  }

  /** 添加自定义源：返回 null 表示成功，否则为错误提示 */
  function addCustom(name: string, api: string): string | null {
    const url = api.trim()
    if (!name.trim()) return '请填写源名称'
    if (!/^https?:\/\//.test(url)) return '接口地址需以 http(s):// 开头'
    const id = 'custom-' + Date.now().toString(36)
    customSources.value = [...customSources.value, { id, name: name.trim(), api: url, custom: true }]
    return null
  }

  function removeCustom(id: string) {
    customSources.value = customSources.value.filter((s) => s.id !== id)
  }

  return { disabledIds, customSources, allSources, enabledSources, toggle, isEnabled, addCustom, removeCustom }
})
