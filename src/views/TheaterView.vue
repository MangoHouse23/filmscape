<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ChevronUp, Heart, ListVideo, Loader2, RotateCcw, Zap } from 'lucide-vue-next'
import { fetchDetail, hasVideo } from '@/api/cms'
import { useSourcesStore } from '@/stores/sources'
import { useLibraryStore } from '@/stores/library'
import PlayerStage from '@/components/PlayerStage.vue'
import EpisodeGrid from '@/components/EpisodeGrid.vue'
import type { WorkDetail } from '@/types'

const route = useRoute()
const router = useRouter()
const sourcesStore = useSourcesStore()
const library = useLibraryStore()

const detail = ref<WorkDetail | null>(null)
const loading = ref(true)
const loadError = ref(false)
const playerError = ref(false)
const playerRetry = ref(0)
const epIdx = ref(0)
const showEpisodes = ref(false)
/** 红果式默认自动连播 */
const continuous = ref(true)
/** 首次进入的滑动切集提示 */
const showSwipeHint = ref(true)

/** 自动选可播线路：优先直链（m3u8/mp4），跳过解析页短链线路（如 jsyun） */
const groupIdx = computed(() => {
  const gs = detail.value?.playGroups || []
  const i = gs.findIndex((g) => g.episodes.some((e) => /\.(m3u8|mp4|flv)/i.test(e.url)))
  return i === -1 ? 0 : i
})
const episodes = computed(() => detail.value?.playGroups[groupIdx.value]?.episodes || [])
const currentEp = computed(() => episodes.value[epIdx.value])
const hasPrev = computed(() => epIdx.value > 0)
const hasNext = computed(() => epIdx.value < episodes.value.length - 1)
const isFav = computed(() =>
  detail.value ? library.isFav(detail.value.sourceId, detail.value.vodId) : false,
)

const startAt = computed(() => {
  if (!detail.value) return 0
  const h = library.getProgress(detail.value.sourceId, detail.value.vodId)
  if (h && h.episodeIndex === epIdx.value && h.position > 15) return h.position
  return 0
})

async function load() {
  loading.value = true
  loadError.value = false
  playerError.value = false
  detail.value = null
  const sid = String(route.params.sourceId)
  const vodId = Number(route.params.vodId)
  try {
    const d = await fetchDetail(
      sourcesStore.allSources.find((s) => s.id === sid) || { id: sid, name: sid, api: '' },
      vodId,
    )
    if (!hasVideo(d)) throw new Error('无片源')
    detail.value = d
    const h = library.getProgress(sid, vodId)
    epIdx.value = Math.min(
      route.query.ep ? Math.max(0, Number(route.query.ep) || 0) : h?.episodeIndex || 0,
      Math.max(0, d.playGroups[0]?.episodes.length - 1),
    )
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch(() => [route.params.sourceId, route.params.vodId], load, { immediate: true })

function setEp(i: number) {
  if (!detail.value || i < 0 || i > episodes.value.length - 1) return
  playerError.value = false
  epIdx.value = i
  showEpisodes.value = false
  dismissSwipeHint()
}

function saveProgress(position: number, duration: number) {
  if (!detail.value || !currentEp.value) return
  library.saveProgress({
    sourceId: detail.value.sourceId,
    vodId: detail.value.vodId,
    name: detail.value.name,
    pic: detail.value.pic,
    typeName: detail.value.typeName,
    episodeIndex: epIdx.value,
    episodeName: currentEp.value.name,
    position,
    duration,
  })
}

/** 红果式：播完自动连播下一集 */
function onEnded() {
  if (continuous.value && hasNext.value) setEp(epIdx.value + 1)
}

function toggleFav() {
  if (!detail.value) return
  library.toggleFav({
    sourceId: detail.value.sourceId,
    vodId: detail.value.vodId,
    name: detail.value.name,
    pic: detail.value.pic,
    remarks: detail.value.remarks,
    typeName: detail.value.typeName,
  })
}

/* 红果式上下滑切集：桌面滚轮 + 移动端触摸滑动 */
let wheelLock = 0
function onWheel(e: WheelEvent) {
  const now = Date.now()
  if (now - wheelLock < 900 || Math.abs(e.deltaY) < 30) return
  wheelLock = now
  dismissSwipeHint()
  if (e.deltaY > 0) {
    if (hasNext.value) setEp(epIdx.value + 1)
  } else if (hasPrev.value) setEp(epIdx.value - 1)
}
let touchY = 0
function onTouchStart(e: TouchEvent) {
  touchY = e.touches[0]?.clientY ?? 0
}
function onTouchEnd(e: TouchEvent) {
  const dy = touchY - (e.changedTouches[0]?.clientY ?? 0)
  if (Math.abs(dy) < 60) return
  dismissSwipeHint()
  if (dy > 0 && hasNext.value) setEp(epIdx.value + 1)
  else if (dy < 0 && hasPrev.value) setEp(epIdx.value - 1)
}

let hintTimer = 0
function dismissSwipeHint() {
  showSwipeHint.value = false
  window.clearTimeout(hintTimer)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowRight' && hasNext.value) setEp(epIdx.value + 1)
  else if (e.key === 'ArrowLeft' && hasPrev.value) setEp(epIdx.value - 1)
}

function close() {
  if (window.history.length > 1) router.back()
  else router.push('/channel/shortdrama')
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
  hintTimer = window.setTimeout(dismissSwipeHint, 6000)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.clearTimeout(hintTimer)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col bg-black text-white">
    <!-- 顶栏 -->
    <div class="absolute inset-x-0 top-0 z-20 flex items-start gap-3 bg-gradient-to-b from-black/75 via-black/35 to-transparent px-4 pb-10 pt-3">
      <button
        aria-label="返回"
        class="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/40 backdrop-blur transition hover:bg-black/60"
        @click="close"
      >
        <ChevronLeft class="size-5" />
      </button>
      <div class="min-w-0 pt-1">
        <p class="truncate text-sm font-bold md:text-base">{{ detail?.name || '加载中…' }}</p>
        <p v-if="episodes.length" class="mt-0.5 text-xs text-white/60">
          {{ currentEp?.name }} · {{ epIdx + 1 }}/{{ episodes.length }} 集
        </p>
      </div>
    </div>

    <!-- 播放区：上下滑切集 -->
    <div
      class="relative min-h-0 flex-1"
      @wheel="onWheel"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <PlayerStage
        v-if="detail && currentEp && !playerError"
        :key="playerRetry"
        class="h-full"
        variant="vertical"
        :url="currentEp.url"
        :title="`${detail.name} ${currentEp.name}`"
        :start-at="startAt"
        @progress="saveProgress"
        @ended="onEnded"
        @error="playerError = true"
      />

      <!-- 上滑提示 -->
      <transition name="fade-in">
        <div
          v-if="showSwipeHint && !loading && !loadError"
          class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 px-5 py-2.5 text-xs text-white/85 backdrop-blur"
        >
          <ChevronUp class="mr-1 inline size-4 animate-bounce align-[-3px]" />
          上滑下一集 · 点击画面可暂停
        </div>
      </transition>

      <!-- 加载中 -->
      <div v-if="loading" class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
        <Loader2 class="size-8 animate-spin" />
        <p class="text-sm">正在拉取片源…</p>
      </div>

      <!-- 详情失败 -->
      <div v-if="!loading && loadError" class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p class="text-sm text-white/80">这部短剧暂时拉不到片源，可能已下架。</p>
        <div class="flex gap-3">
          <button class="rounded-full bg-white/15 px-5 py-2 text-sm backdrop-blur transition hover:bg-white/25" @click="load">重试</button>
          <button class="rounded-full bg-white px-5 py-2 text-sm font-bold text-black" @click="close">返回剧单</button>
        </div>
      </div>

      <!-- 播放失败 -->
      <div v-if="!loading && !loadError && playerError" class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p class="text-sm text-white/80">这一集播放出错了，试试重试或切换集数。</p>
        <div class="flex gap-3">
          <button class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-5 py-2 text-sm backdrop-blur transition hover:bg-white/25" @click="playerRetry++">
            <RotateCcw class="size-4" /> 重试本集
          </button>
          <button v-if="hasNext" class="rounded-full bg-white px-5 py-2 text-sm font-bold text-black" @click="setEp(epIdx + 1)">下一集</button>
        </div>
      </div>

      <!-- 右侧悬浮操作栏（红果式） -->
      <div class="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-2.5">
        <button
          class="flex size-11 flex-col items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
          aria-label="选集"
          @click="showEpisodes = !showEpisodes"
        >
          <ListVideo class="size-5" />
          <span class="mt-0.5 text-[9px] leading-none">选集</span>
        </button>
        <button
          class="flex size-11 flex-col items-center justify-center rounded-full bg-black/45 backdrop-blur transition hover:bg-black/65"
          :class="isFav ? 'text-tangerine' : 'text-white'"
          aria-label="收藏"
          @click="toggleFav"
        >
          <Heart class="size-5" :fill="isFav ? 'currentColor' : 'none'" />
          <span class="mt-0.5 text-[9px] leading-none">{{ isFav ? '已收藏' : '收藏' }}</span>
        </button>
        <button
          class="flex size-11 flex-col items-center justify-center rounded-full backdrop-blur transition"
          :class="continuous ? 'bg-tangerine text-white' : 'bg-black/45 text-white hover:bg-black/65'"
          aria-label="自动连播"
          @click="continuous = !continuous"
        >
          <Zap class="size-5" fill="currentColor" />
          <span class="mt-0.5 text-[9px] leading-none">连播</span>
        </button>
      </div>
    </div>

    <!-- 底部：上/下一集 + 集数条 -->
    <div v-if="episodes.length" class="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pb-4 pt-10">
      <div class="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
        <button
          class="shrink-0 rounded-full border border-white/25 px-3 py-1 text-xs text-white/85 transition disabled:opacity-30"
          :disabled="!hasPrev"
          @click="setEp(epIdx - 1)"
        >
          上一集
        </button>
        <button
          v-for="(ep, i) in episodes"
          :key="i"
          class="shrink-0 rounded-full px-3 py-1 text-xs transition"
          :class="i === epIdx ? 'bg-white font-bold text-black' : 'border border-white/25 text-white/85 hover:border-white/60'"
          @click="setEp(i)"
        >
          {{ ep.name.replace(/^第|集$/g, '') || i + 1 }}
        </button>
        <button
          class="shrink-0 rounded-full border border-white/25 px-3 py-1 text-xs text-white/85 transition disabled:opacity-30"
          :disabled="!hasNext"
          @click="setEp(epIdx + 1)"
        >
          下一集
        </button>
      </div>
    </div>

    <!-- 选集抽屉 -->
    <transition name="fade-in">
      <div
        v-if="showEpisodes"
        class="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm"
        @click.self="showEpisodes = false"
      >
        <div class="absolute inset-x-0 bottom-0 max-h-[65vh] overflow-y-auto rounded-t-3xl bg-neutral-900 p-5 pb-8 text-white shadow-lift">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-display text-lg font-bold">选集 · {{ detail?.name }}</h3>
            <button class="rounded-full bg-white/10 px-3 py-1 text-xs" @click="showEpisodes = false">收起</button>
          </div>
          <EpisodeGrid :episodes="episodes" :active="epIdx" @select="setEp" />
        </div>
      </div>
    </transition>
  </div>
</template>
