<script setup lang="ts">
import { Clapperboard, Compass, Home, Search, User } from 'lucide-vue-next'

const tabs = [
  { to: '/', label: '首页', icon: Home, exact: true },
  { to: '/channel/movie', label: '频道', icon: Compass, exact: false },
  { to: '/channel/shortdrama', label: '短剧场', icon: Clapperboard, exact: false },
  { to: '/search', label: '搜索', icon: Search, exact: false },
  { to: '/library', label: '我的', icon: User, exact: false },
]
</script>

<template>
  <nav
    class="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/70 pb-[env(safe-area-inset-bottom)] lg:hidden"
    aria-label="底部导航"
  >
    <div class="flex items-stretch justify-around">
      <router-link
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        class="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] transition-colors"
        :class="
          $route.path === t.to || (!t.exact && $route.path.startsWith(t.to))
            ? 'font-bold text-brand'
            : 'text-ink2'
        "
      >
        <component :is="t.icon" class="size-5" :stroke-width="2" />
        {{ t.label }}
      </router-link>
    </div>
  </nav>
</template>
