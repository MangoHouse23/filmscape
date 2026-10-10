<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Episode } from '@/types'

const props = defineProps<{
  episodes: Episode[]
  active: number
}>()

const emit = defineEmits<{ (e: 'select', i: number): void }>()

const COLLAPSED = 30
const expanded = ref(false)
const shown = computed(() =>
  expanded.value || props.episodes.length <= COLLAPSED + 6
    ? props.episodes
    : props.episodes.slice(0, COLLAPSED),
)
</script>

<template>
  <div>
    <div class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
      <button
        v-for="(ep, i) in shown"
        :key="ep.url"
        class="truncate rounded-lg border px-2 py-2 text-xs transition-all duration-200 md:text-sm"
        :class="
          i === active
            ? 'border-brand bg-brand font-bold text-paper shadow-soft'
            : 'border-line text-ink2 hover:border-brand/60 hover:text-brand'
        "
        :title="ep.name"
        @click="emit('select', i)"
      >
        {{ ep.name }}
      </button>
    </div>
    <button
      v-if="episodes.length > shown.length"
      class="btn-ghost mt-3 px-4 py-1.5 text-xs"
      @click="expanded = true"
    >
      展开全部 {{ episodes.length }} 集
    </button>
  </div>
</template>
