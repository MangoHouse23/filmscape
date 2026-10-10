<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Play, Star } from 'lucide-vue-next'
import type { Work } from '@/types'

const props = defineProps<{ works: Work[] }>()

const index = ref(0)
const timer = ref<number | null>(null)
const paused = ref(false)

const current = computed(() => props.works[index.value])

function go(i: number) {
  index.value = (i + props.works.length) % props.works.length
}

function start() {
  stop()
  timer.value = window.setInterval(() => {
    if (!paused.value) go(index.value + 1)
  }, 6000)
}

function stop() {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <div
    v-if="current"
    class="relative h-[400px] overflow-hidden rounded-3xl shadow-lift md:h-[460px] lg:h-[520px]"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <!-- 背景大图 -->
    <transition name="fade-in" mode="out-in">
      <img
        :key="current.key"
        :src="current.pic"
        :alt="current.name"
        referrerpolicy="no-referrer"
        class="absolute inset-0 size-full scale-110 object-cover"
      />
    </transition>
    <!-- 纸感渐变蒙版 -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-paper via-paper/75 to-paper/10 dark:from-[#0F1E18] dark:via-[#0F1E18]/75 dark:to-transparent"
    ></div>
    <div
      class="absolute inset-0 bg-gradient-to-r from-paper/95 via-paper/40 to-transparent dark:from-[#0F1E18]/95 dark:via-[#0F1E18]/40"
    ></div>

    <!-- 文案区 -->
    <transition name="fade-in" mode="out-in">
      <div :key="'t' + current.key" class="absolute inset-x-0 bottom-0 p-6 md:p-10 lg:p-14">
        <span
          class="mb-3 inline-block rounded-full bg-tangerine/15 px-3 py-1 text-xs font-bold text-tangerine"
        >
          {{ current.typeName || '精选推荐' }}
        </span>
        <h1 class="max-w-2xl font-display text-3xl font-black leading-tight text-ink md:text-5xl">
          {{ current.name }}
        </h1>
        <p class="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink2 md:text-sm">
          <span v-if="current.score" class="inline-flex items-center gap-1 font-bold text-gold">
            <Star class="size-3.5" fill="currentColor" />{{ Number(current.score).toFixed(1) }}
          </span>
          <span v-if="current.year">{{ current.year }}</span>
          <span v-if="current.remarks">{{ current.remarks }}</span>
        </p>
        <div class="mt-5 flex items-center gap-3">
          <router-link
            :to="`/play/${current.sourceId}/${current.vodId}`"
            class="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm"
          >
            <Play class="size-4" fill="currentColor" /> 立即观看
          </router-link>
        </div>
      </div>
    </transition>

    <!-- 指示点 -->
    <div class="absolute bottom-5 right-6 flex gap-2 md:bottom-8 md:right-10">
      <button
        v-for="(w, i) in works"
        :key="w.key"
        :aria-label="`切换到 ${w.name}`"
        class="h-1.5 rounded-full transition-all duration-300"
        :class="i === index ? 'w-6 bg-tangerine' : 'w-1.5 bg-ink/25 hover:bg-ink/40'"
        @click="go(i)"
      ></button>
    </div>
  </div>
</template>
