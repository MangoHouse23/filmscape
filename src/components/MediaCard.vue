<script setup lang="ts">
import { computed } from 'vue'
import { Play, Star } from 'lucide-vue-next'
import type { Work } from '@/types'

const props = defineProps<{ work: Work; progress?: number; badge?: string }>()

const to = computed(
  () => `/play/${encodeURIComponent(props.work.sourceId)}/${props.work.vodId}`,
)
const progressPct = computed(() =>
  props.progress != null ? Math.min(100, Math.round(props.progress * 100)) : 0,
)
</script>

<template>
  <router-link :to="to" class="group block" :aria-label="work.name">
    <div
      class="relative aspect-[2/3] overflow-hidden rounded-xl bg-sage/15 shadow-soft transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lift"
    >
      <img
        v-if="work.pic"
        :src="work.pic"
        :alt="work.name"
        loading="lazy"
        referrerpolicy="no-referrer"
        class="size-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
      />
      <div
        v-else
        class="flex size-full items-center justify-center font-display text-3xl text-brand/40"
      >
        {{ work.name.slice(0, 1) }}
      </div>

      <!-- 观看进度条 -->
      <div v-if="progressPct > 0" class="absolute inset-x-0 bottom-0 h-1 bg-black/40">
        <div class="h-full bg-tangerine" :style="{ width: progressPct + '%' }"></div>
      </div>

      <!-- 悬浮播放按钮 -->
      <div
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-brand/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <span
          class="flex size-11 items-center justify-center rounded-full bg-paper/90 text-brand shadow-lift"
        >
          <Play class="size-5 translate-x-[1px]" fill="currentColor" />
        </span>
      </div>

      <!-- 备注：更新至xx集 / HD -->
      <span
        v-if="work.remarks"
        class="absolute right-1.5 top-1.5 max-w-[75%] truncate rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
      >
        {{ work.remarks }}
      </span>

      <!-- 徽标：如 AI 出品 -->
      <span
        v-if="badge"
        class="absolute left-1.5 top-1.5 rounded-md bg-tangerine px-1.5 py-0.5 text-[10px] font-bold text-white shadow-soft"
      >
        {{ badge }}
      </span>

      <!-- 评分 -->
      <span
        v-if="work.score"
        class="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-sm"
      >
        <Star class="size-2.5" fill="currentColor" />
        {{ Number(work.score).toFixed(1) }}
      </span>
    </div>

    <p class="mt-2 truncate text-sm font-medium text-ink">{{ work.name }}</p>
    <p class="truncate text-xs text-ink2">
      {{ [work.year, work.typeName].filter(Boolean).join(' · ') || '—' }}
    </p>
  </router-link>
</template>
