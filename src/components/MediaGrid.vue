<script setup lang="ts">
import { computed } from 'vue'
import MediaCard from './MediaCard.vue'
import SkeletonCard from './SkeletonCard.vue'
import type { Work } from '@/types'

const props = withDefaults(
  defineProps<{
    works: Work[]
    loading?: boolean
    skeletons?: number
    badge?: string
    /** 渲染数量对齐 12 的倍数（3/4/6 列的公倍数），避免各断点最后一行留空；仅用于可追加/精选场景 */
    align?: boolean
  }>(),
  { loading: false, skeletons: 12, badge: undefined, align: false },
)

const display = computed(() => {
  if (!props.align) return props.works
  const n = props.works.length
  const cut = Math.floor(n / 12) * 12
  return cut > 0 ? props.works.slice(0, cut) : props.works
})
</script>

<template>
  <div class="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
    <template v-if="loading && !works.length">
      <SkeletonCard v-for="i in skeletons" :key="'sk' + i" />
    </template>
    <template v-else>
      <MediaCard v-for="w in display" :key="w.sourceId + w.vodId" :work="w" :badge="badge" />
    </template>
  </div>
</template>
