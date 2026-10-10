<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

defineProps<{
  title: string
  subtitle?: string
  moreTo?: string
}>()

const scroller = ref<HTMLElement | null>(null)

function scrollBy(dir: 1 | -1) {
  scroller.value?.scrollBy({ left: dir * (scroller.value.clientWidth * 0.8), behavior: 'smooth' })
}
</script>

<template>
  <section class="fade-in">
    <div class="mb-3 flex items-end justify-between">
      <div class="flex items-baseline gap-2">
        <h2 class="font-display text-xl font-bold text-ink md:text-2xl">{{ title }}</h2>
        <span v-if="subtitle" class="text-xs text-ink2">{{ subtitle }}</span>
      </div>
      <div class="flex items-center gap-2">
        <router-link
          v-if="moreTo"
          :to="moreTo"
          class="text-xs font-medium text-ink2 transition-colors hover:text-brand md:text-sm"
        >
          更多 →
        </router-link>
        <div class="hidden gap-1.5 md:flex">
          <button
            aria-label="向左滚动"
            class="flex size-8 items-center justify-center rounded-full border border-line text-ink2 transition hover:border-brand hover:text-brand"
            @click="scrollBy(-1)"
          >
            <ChevronLeft class="size-4" />
          </button>
          <button
            aria-label="向右滚动"
            class="flex size-8 items-center justify-center rounded-full border border-line text-ink2 transition hover:border-brand hover:text-brand"
            @click="scrollBy(1)"
          >
            <ChevronRight class="size-4" />
          </button>
        </div>
      </div>
    </div>

    <div
      ref="scroller"
      class="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1"
    >
      <slot />
    </div>
  </section>
</template>
