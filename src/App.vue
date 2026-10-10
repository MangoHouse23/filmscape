<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import AppNav from '@/components/AppNav.vue'
import AppTabBar from '@/components/AppTabBar.vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
settings.applyTheme()

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  const typing = /input|textarea|select/i.test(target?.tagName || '')
  if (e.key === '/' && !typing) {
    e.preventDefault()
    window.location.hash = '#/search'
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppNav />
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <AppTabBar />
    <footer class="hidden border-t border-line/60 py-8 text-center text-xs text-ink2 lg:block">
      <p>
        <span class="font-display font-bold text-brand">拾光 Filmscape</span>
        · 免费无广告的影视聚合 · 数据来自公开采集源，仅供学习交流
      </p>
      <p class="mt-1">按 <kbd class="rounded border border-line px-1">/</kbd> 快速搜索 · 内容版权归原方所有，请支持正版</p>
    </footer>
  </div>
</template>
