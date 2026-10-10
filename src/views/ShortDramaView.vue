<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Clapperboard, Sparkles } from 'lucide-vue-next'
import { fetchAiPage, fetchChannelPage } from '@/api/cms'
import { genresOf, topGenres } from '@/api/genres'
import { useSourcesStore } from '@/stores/sources'
import ShortCard from '@/components/ShortCard.vue'
import FilterChips from '@/components/FilterChips.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { Work } from '@/types'

const route = useRoute()
const router = useRouter()
const sourcesStore = useSourcesStore()

/* ------- 红果式双剧场：真人短剧 / AI 短剧，tab 切换 ------- */
type Mode = 'real' | 'ai'
const mode = ref<Mode>(route.query.tab === 'ai' ? 'ai' : 'real')

const realWorks = ref<Work[]>([])
const aiWorks = ref<Work[]>([])
const realState = { page: 1, exhausted: false }
const aiState = { page: 1, exhausted: false }

const loading = ref(false)
const loadingMore = ref(false)
const failedSources = ref<string[]>([])
/** 各源片库总量合计（源端真实总数） */
const libraryTotal = ref(0)

const works = computed(() => (mode.value === 'ai' ? aiWorks : realWorks).value)
const exhausted = computed(() => (mode.value === 'ai' ? aiState : realState).exhausted)

async function load(reset: boolean) {
  const isAi = mode.value === 'ai'
  const pool = isAi ? aiWorks : realWorks
  const st = isAi ? aiState : realState
  if (reset) {
    st.page = 1
    st.exhausted = false
    pool.value = []
  }
  if (st.exhausted) return
  reset ? (loading.value = true) : (loadingMore.value = true)
  try {
    const res = isAi
      ? await fetchAiPage(st.page, sourcesStore.enabledSources)
      : await fetchChannelPage('shortdrama', st.page, sourcesStore.enabledSources)
    failedSources.value = res.errors
    if (res.total) libraryTotal.value = res.total
    if (!res.works.length) st.exhausted = true
    pool.value = reset ? res.works : [...pool.value, ...res.works]
    if (res.works.length) st.page += 1
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

watch(
  () => route.path,
  () => {
    if (route.path !== '/channel/shortdrama') return
    if (!works.value.length) load(true)
  },
  { immediate: true },
)

/* 剧场切换：重置题材筛选，AI 剧场懒加载 */
watch(mode, (m) => {
  router.replace({ query: { ...route.query, tab: m === 'ai' ? 'ai' : undefined } })
  genreFilter.value = ''
  if (m === 'ai' && !aiWorks.value.length && route.path === '/channel/shortdrama') load(true)
})
watch(
  () => route.query.tab,
  (t) => {
    const m: Mode = t === 'ai' ? 'ai' : 'real'
    if (m !== mode.value) mode.value = m
  },
)

/* 红果式题材 tab（按当前剧场内容池统计） */
const genreFilter = ref('')
const genreOptions = computed(() => topGenres(works.value))
const filtered = computed(() =>
  genreFilter.value
    ? works.value.filter((w) => genresOf(w).includes(genreFilter.value))
    : works.value,
)

/** 渲染数量对齐 12 的倍数（移动 2/3 列与桌面 4/6 列的公倍数），避免任何断点下最后一行留空 */
const renderList = computed(() => {
  const n = filtered.value.length
  const cut = Math.floor(n / 12) * 12
  return cut > 0 ? filtered.value.slice(0, cut) : filtered.value
})

/** 万部级数量格式化：78000 → 7.8万+ */
const totalLabel = computed(() => {
  const t = libraryTotal.value
  if (t >= 10000) return `${(t / 10000).toFixed(1).replace(/\.0$/, '')}万+`
  return t ? `${t}+` : ''
})

/* 红果式触底无限滚动 */
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (
        entries.some((e) => e.isIntersecting) &&
        works.value.length &&
        !exhausted.value &&
        !loading.value &&
        !loadingMore.value
      ) {
        load(false)
      }
    },
    { rootMargin: '600px 0px' },
  )
  if (sentinel.value) observer.observe(sentinel.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-6 lg:pb-16">
    <!-- 红果式轻页头 -->
    <div class="mb-4 flex items-end justify-between rise-in">
      <div>
        <h1 class="font-display text-3xl font-black text-ink md:text-4xl">短剧场</h1>
        <p class="mt-1 text-sm text-ink2">
          竖屏爽剧 ·
          <template v-if="totalLabel">片库 <b class="text-tangerine">{{ totalLabel }}</b> 部 ·</template>
          已加载 <b class="text-tangerine">{{ works.length }}</b> 部 · 免费追更
        </p>
      </div>
      <span class="hidden rounded-full border border-line px-3 py-1 text-xs text-ink2 md:block">
        上滑切集 · 自动连播
      </span>
    </div>

    <!-- 剧场切换：真人短剧 / AI 短剧 -->
    <div class="mb-3 flex items-center gap-2 rise-in">
      <button
        class="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold transition-all duration-200"
        :class="
          mode === 'real'
            ? 'bg-brand text-paper shadow-soft'
            : 'border border-line text-ink2 hover:border-brand/50 hover:text-brand'
        "
        @click="mode = 'real'"
      >
        <Clapperboard class="size-4" /> 真人短剧
      </button>
      <button
        class="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold transition-all duration-200"
        :class="
          mode === 'ai'
            ? 'bg-brand text-paper shadow-soft'
            : 'border border-line text-ink2 hover:border-brand/50 hover:text-brand'
        "
        @click="mode = 'ai'"
      >
        <Sparkles class="size-4" /> AI 短剧
      </button>
    </div>

    <!-- 题材 tab（横滑胶囊） -->
    <div class="sticky top-16 z-30 -mx-4 bg-paper/85 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
      <FilterChips v-model="genreFilter" :options="genreOptions" all-label="精选" />
    </div>

    <!-- 竖版瀑布流 -->
    <div class="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      <template v-if="loading && !works.length">
        <div v-for="i in 12" :key="i">
          <div class="aspect-[9/16] animate-pulse rounded-xl bg-sage/20"></div>
          <div class="mt-2 h-4 w-4/5 animate-pulse rounded bg-sage/20"></div>
          <div class="mt-1.5 h-3 w-2/5 animate-pulse rounded bg-sage/15"></div>
        </div>
      </template>
      <template v-else>
        <ShortCard
          v-for="w in renderList"
          :key="w.sourceId + w.vodId"
          :work="w"
          :badge="mode === 'ai' ? 'AI' : undefined"
          class="rise-in"
        />
      </template>
    </div>

    <EmptyState
      v-if="!loading && works.length && !filtered.length"
      title="这个题材下暂无内容"
      desc="换个题材试试，或回「精选」看全部片单。"
    >
      <button class="btn-primary mt-2 px-6 py-2 text-sm" @click="genreFilter = ''">回到精选</button>
    </EmptyState>

    <EmptyState
      v-if="!loading && !works.length"
      :title="mode === 'ai' ? 'AI 片单暂时没加载出来' : '短剧场暂时没加载出来'"
      :desc="failedSources.length ? `${failedSources.join('、')} 等源暂时失联，试试在「我的 → 数据源」切换其他源` : '采集源可能开小差了，稍后再来刷新试试。'"
    >
      <button class="btn-primary mt-2 px-6 py-2 text-sm" @click="load(true)">重新加载</button>
    </EmptyState>

    <!-- 无限滚动哨兵：触底自动加载 -->
    <div ref="sentinel" class="h-px w-full"></div>
    <div v-if="works.length" class="mt-8 flex justify-center text-sm text-ink2">
      <span v-if="exhausted">— 到底啦，切个剧场继续追吧 —</span>
      <span v-else-if="loadingMore" class="animate-pulse">正在加载更多…</span>
      <span v-else>下拉自动加载 · 片库持续更新</span>
    </div>
  </div>
</template>
