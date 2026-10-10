<script setup lang="ts">
import { Compass, Moon, Search, Sun } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import { CHANNELS } from '@/api/sources'

const settings = useSettingsStore()

const links = [
  { to: '/', label: '首页', exact: true },
  ...CHANNELS.map((c) => ({ to: `/channel/${c.key}`, label: c.name, exact: false })),
]
</script>

<template>
  <header class="glass sticky top-0 z-40 border-b border-line/60">
    <div class="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-6">
      <router-link to="/" class="flex items-baseline gap-2">
        <span class="font-display text-2xl font-black tracking-wide text-ink">拾光</span>
        <span class="hidden text-[10px] font-bold uppercase tracking-[0.3em] text-tangerine sm:block">
          Filmscape
        </span>
      </router-link>

      <nav class="hidden items-center gap-1 lg:flex" aria-label="主导航">
        <router-link
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="rounded-full px-3.5 py-1.5 text-sm transition-all duration-200"
          :class="
            $route.path === l.to || (!l.exact && $route.path.startsWith(l.to))
              ? 'bg-brand text-paper font-bold shadow-soft'
              : 'text-ink2 hover:bg-brand/10 hover:text-brand'
          "
        >
          {{ l.label }}
        </router-link>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <router-link
          to="/search"
          aria-label="搜索"
          class="hidden items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-xs text-ink2 transition hover:border-brand/60 hover:text-brand md:flex"
        >
          <Search class="size-3.5" />
          搜索全网片源
          <kbd class="rounded border border-line px-1 text-[10px]">/</kbd>
        </router-link>
        <button
          aria-label="切换主题"
          class="flex size-9 items-center justify-center rounded-full border border-line text-ink2 transition hover:border-brand/60 hover:text-brand"
          @click="settings.toggleTheme()"
        >
          <Moon v-if="!settings.isDark" class="size-4" />
          <Sun v-else class="size-4" />
        </button>
      </div>
    </div>
  </header>
</template>
