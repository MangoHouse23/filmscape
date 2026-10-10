<script setup lang="ts">
import { Compass } from 'lucide-vue-next'
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center">
    <p class="font-display text-8xl font-black text-brand/20">404</p>
    <h1 class="mt-4 font-display text-2xl font-bold text-ink">这一帧走丢了</h1>
    <p class="mt-2 text-sm text-ink2">影片不在片库里，可能被拿去修复了。</p>
    <router-link to="/" class="btn-primary mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm">
      <Compass class="size-4" /> 回到首页
    </router-link>
  </div>
</template>
