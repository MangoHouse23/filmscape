<script setup lang="ts">
import { Clapperboard } from 'lucide-vue-next'

defineProps<{
  title: string
  desc?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div class="float-slow flex size-16 items-center justify-center rounded-full bg-sage/15">
      <Clapperboard class="size-7 text-brand/60" />
    </div>
    <p class="font-display text-lg font-bold text-ink">{{ title }}</p>
    <p v-if="desc" class="max-w-xs text-sm text-ink2">{{ desc }}</p>
    <slot />
  </div>
</template>
