<script setup lang="ts">
import { computed } from 'vue'
import { Play } from 'lucide-vue-next'
import { genresOf } from '@/api/genres'
import type { Work } from '@/types'

const props = defineProps<{ work: Work; badge?: string }>()

const to = computed(
  () => `/theater/${encodeURIComponent(props.work.sourceId)}/${props.work.vodId}`,
)
/** 红果式：海报右上角放题材角标 */
const genre = computed(() => genresOf(props.work)[0] || '')
</script>

<template>
  <router-link :to="to" class="group block" :aria-label="work.name">
    <div
      class="relative aspect-[9/16] overflow-hidden rounded-xl bg-sage/15 shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lift"
    >
      <img
        v-if="work.pic"
        :src="work.pic"
        :alt="work.name"
        loading="lazy"
        referrerpolicy="no-referrer"
        class="size-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
      />
      <div
        v-else
        class="flex size-full items-center justify-center px-2 text-center font-display text-lg text-brand/40"
      >
        {{ work.name.slice(0, 4) }}
      </div>

      <!-- 集数/更新状态角标 -->
      <span
        v-if="work.remarks"
        class="absolute left-1.5 top-1.5 max-w-[70%] truncate rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
      >
        {{ work.remarks }}
      </span>

      <!-- 题材角标（+ 可选 AI 徽标） -->
      <span
        v-if="badge || genre"
        class="absolute right-1.5 top-1.5 flex items-center gap-1"
      >
        <span
          v-if="badge"
          class="rounded-md bg-tangerine px-1.5 py-0.5 text-[10px] font-bold text-white shadow-soft"
        >{{ badge }}</span>
        <span
          v-if="genre"
          class="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm"
        >{{ genre }}</span>
      </span>

      <!-- 悬浮播放 -->
      <div
        class="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <span class="flex size-11 items-center justify-center rounded-full bg-paper/90 text-brand shadow-lift">
          <Play class="size-5 translate-x-[1px]" fill="currentColor" />
        </span>
      </div>
    </div>

    <p class="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-ink">{{ work.name }}</p>
    <p class="mt-0.5 truncate text-xs text-ink2">{{ work.remarks || '正片上线' }}</p>
  </router-link>
</template>
