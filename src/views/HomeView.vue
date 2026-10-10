<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { History, Sparkles } from 'lucide-vue-next'
import { fetchChannelPage } from '@/api/cms'
import { useSourcesStore } from '@/stores/sources'
import { useLibraryStore } from '@/stores/library'
import { useRecommend } from '@/composables/useRecommend'
import HeroCarousel from '@/components/HeroCarousel.vue'
import SectionRow from '@/components/SectionRow.vue'
import MediaCard from '@/components/MediaCard.vue'
import ShortCard from '@/components/ShortCard.vue'
import MediaGrid from '@/components/MediaGrid.vue'
import type { Work } from '@/types'

const sourcesStore = useSourcesStore()
const library = useLibraryStore()

const heroWorks = ref<Work[]>([])
const rows = ref<{ title: string; moreTo: string; theater?: boolean; works: Work[] }[]>([])
const recPool = ref<Work[]>([])
const loading = ref(true)

const recommend = useRecommend(() => recPool.value)

const continueList = computed(() =>
  library.history
    .filter((h) => h.duration > 0 && h.position / h.duration < 0.95 && h.pic)
    .slice(0, 12)
    .map((h) => ({ h, progress: h.duration ? h.position / h.duration : 0 })),
)

onMounted(async () => {
  const srcs = sourcesStore.enabledSources
  const defs = [
    { key: 'movie', title: '电影 · 精选' },
    { key: 'tv', title: '电视剧 · 精选' },
    { key: 'anime', title: '动漫 · 精选' },
    { key: 'shortdrama', title: '短剧场 · 精选' },
    { key: 'show', title: '综艺 · 精选' },
  ]
  const results = await Promise.allSettled(defs.map((d) => fetchChannelPage(d.key, 1, srcs)))
  const pool: Work[] = []
  rows.value = results.flatMap((r, i) => {
    if (r.status !== 'fulfilled' || !r.value.works.length) return []
    pool.push(...r.value.works)
    return [
      {
        title: defs[i].title,
        moreTo: `/channel/${defs[i].key}`,
        theater: defs[i].key === 'shortdrama',
        works: r.value.works.slice(0, 14),
      },
    ]
  })
  recPool.value = pool
  heroWorks.value =
    pool.filter((w) => w.pic && Number(w.score || 0) >= 8).slice(0, 5).length > 0
      ? pool.filter((w) => w.pic && Number(w.score || 0) >= 8).slice(0, 5)
      : pool.filter((w) => w.pic).slice(0, 5)
  loading.value = false
})

function toPlay(h: { sourceId: string; vodId: number }) {
  return `/play/${h.sourceId}/${h.vodId}`
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-10 px-4 pb-28 pt-6 md:px-6 lg:pb-16">
    <!-- Hero 轮播 -->
    <HeroCarousel v-if="heroWorks.length" :works="heroWorks" class="rise-in" />

    <!-- 继续观看 -->
    <SectionRow
      v-if="continueList.length"
      title="继续观看"
      subtitle="从上次的地方开始"
      class="rise-in"
    >
      <router-link
        v-for="c in continueList"
        :key="c.h.sourceId + c.h.vodId"
        :to="toPlay(c.h)"
        class="group w-32 shrink-0 snap-start md:w-40"
      >
        <div
          class="relative aspect-video overflow-hidden rounded-xl bg-sage/15 shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lift"
        >
          <img
            :src="c.h.pic"
            :alt="c.h.name"
            loading="lazy"
            referrerpolicy="no-referrer"
            class="size-full object-cover"
          />
          <div class="absolute inset-x-0 bottom-0 h-1 bg-black/40">
            <div class="h-full bg-tangerine" :style="{ width: Math.round(c.progress * 100) + '%' }"></div>
          </div>
        </div>
        <p class="mt-2 truncate text-sm font-medium text-ink">{{ c.h.name }}</p>
        <p class="truncate text-xs text-ink2">{{ c.h.episodeName }}</p>
      </router-link>
    </SectionRow>

    <!-- 频道精选行 -->
    <template v-if="loading">
      <div v-for="i in 2" :key="i" class="space-y-3">
        <div class="h-7 w-40 animate-pulse rounded-lg bg-sage/20"></div>
        <div class="flex gap-3 overflow-hidden">
          <div v-for="j in 8" :key="j" class="w-36 shrink-0">
            <div class="aspect-[2/3] animate-pulse rounded-xl bg-sage/20"></div>
          </div>
        </div>
      </div>
    </template>

    <SectionRow
      v-for="row in rows"
      :key="row.title"
      :title="row.title"
      :more-to="row.moreTo"
      class="rise-in"
    >
      <template v-if="row.theater">
        <ShortCard
          v-for="w in row.works"
          :key="w.sourceId + w.vodId"
          :work="w"
          class="w-32 shrink-0 snap-start md:w-40"
        />
      </template>
      <template v-else>
        <MediaCard
          v-for="w in row.works"
          :key="w.sourceId + w.vodId"
          :work="w"
          class="w-28 shrink-0 snap-start md:w-36"
        />
      </template>
    </SectionRow>

    <!-- 猜你喜欢 -->
    <section v-if="recommend.length" class="rise-in">
      <div class="mb-3 flex items-baseline gap-2">
        <h2 class="flex items-center gap-2 font-display text-xl font-bold text-ink md:text-2xl">
          <Sparkles class="size-5 text-tangerine" /> 猜你喜欢
        </h2>
        <span class="text-xs text-ink2">根据你的观看口味本地计算，绝不上传</span>
      </div>
      <MediaGrid :works="recommend" align />
    </section>

    <div
      v-else-if="!loading"
      class="card-surface flex items-center gap-3 p-4 text-sm text-ink2"
    >
      <History class="size-4 shrink-0" />
      看过一些影片后，这里会浮现专属于你的推荐。
    </div>
  </div>
</template>
