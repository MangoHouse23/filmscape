<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronLeft,
  Heart,
  Layers,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Zap,
} from 'lucide-vue-next'
import { fetchDetail, fetchRelated, findAlternateSources, hasVideo } from '@/api/cms'
import { useSourcesStore } from '@/stores/sources'
import { useLibraryStore } from '@/stores/library'
import { useSettingsStore } from '@/stores/settings'
import PlayerStage from '@/components/PlayerStage.vue'
import EpisodeGrid from '@/components/EpisodeGrid.vue'
import SourceBadge from '@/components/SourceBadge.vue'
import MediaGrid from '@/components/MediaGrid.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { Work, WorkDetail } from '@/types'

const route = useRoute()
const router = useRouter()
const sourcesStore = useSourcesStore()
const library = useLibraryStore()
const settings = useSettingsStore()

const detail = ref<WorkDetail | null>(null)
const loading = ref(true)
const loadError = ref(false)
const groupIdx = ref(0)
const epIdx = ref(0)
const playerError = ref(false)
const playerKey = ref(0)
const showSwitch = ref(false)
const alternates = ref<Work[]>([])
const findingAlt = ref(false)
const related = ref<Work[]>([])
const relatedLoading = ref(false)

const source = computed(() =>
  sourcesStore.allSources.find((s) => s.id === route.params.sourceId),
)
const isDrama = computed(
  () => !!detail.value && /短剧|短劇/.test(detail.value.typeName || ''),
)
const group = computed(() => detail.value?.playGroups[groupIdx.value])
const episodes = computed(() => group.value?.episodes || [])
const currentEp = computed(() => episodes.value[epIdx.value])
const startAt = computed(() => {
  const h = library.getProgress(String(route.params.sourceId), Number(route.params.vodId))
  if (h && h.episodeIndex === epIdx.value && h.position > 15) return h.position
  return 0
})

async function load() {
  loading.value = true
  loadError.value = false
  playerError.value = false
  detail.value = null
  related.value = []
  alternates.value = []
  showSwitch.value = false
  const sid = String(route.params.sourceId)
  const vodId = Number(route.params.vodId)
  try {
    const d = await fetchDetail(
      sourcesStore.allSources.find((s) => s.id === sid) || { id: sid, name: sid, api: '' },
      vodId,
    )
    detail.value = d
    const h = library.getProgress(sid, vodId)
    epIdx.value = route.query.ep
      ? Math.max(0, Number(route.query.ep) || 0)
      : h?.episodeIndex || 0
    epIdx.value = Math.min(epIdx.value, Math.max(0, (d.playGroups[0]?.episodes.length || 1) - 1))
    if (!hasVideo(d)) loadError.value = true
    relatedLoading.value = true
    if (d.typeId) {
      fetchRelated(
        sourcesStore.allSources.find((s) => s.id === sid) || { id: sid, name: sid, api: '' },
        d.typeId,
        vodId,
      )
        .then((r) => (related.value = r))
        .finally(() => (relatedLoading.value = false))
    }
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch(() => [route.params.sourceId, route.params.vodId], load, { immediate: true })

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

function onEnded() {
  const auto =
    (isDrama.value && settings.settings.dramaContinuous) || settings.settings.autoNext
  if (auto && epIdx.value < episodes.value.length - 1) epIdx.value += 1
}

async function loadAlternates() {
  if (!detail.value || findingAlt.value) return
  findingAlt.value = true
  showSwitch.value = true
  try {
    alternates.value = await findAlternateSources(
      detail.value.name,
      detail.value.sourceId,
      sourcesStore.enabledSources,
    )
  } finally {
    findingAlt.value = false
  }
}

function switchTo(w: Work) {
  router.replace({ path: `/play/${w.sourceId}/${w.vodId}`, query: { ep: String(epIdx.value) } })
}

function retryPlayer() {
  playerError.value = false
  playerKey.value += 1
}

function goEp(delta: number) {
  const next = epIdx.value + delta
  if (next >= 0 && next < episodes.value.length) epIdx.value = next
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-6 lg:pb-16">
    <button
      class="mb-4 inline-flex items-center gap-1 text-sm text-ink2 transition hover:text-brand"
      @click="$router.back()"
    >
      <ChevronLeft class="size-4" /> 返回
    </button>

    <template v-if="loading">
      <div class="aspect-video w-full animate-pulse rounded-2xl bg-sage/20"></div>
    </template>

    <EmptyState
      v-else-if="!detail || loadError"
      title="影片加载失败"
      desc="这个源可能暂时失联，试试搜索片名从其他源观看。"
    >
      <router-link to="/search" class="btn-primary mt-2 px-6 py-2 text-sm">去搜索</router-link>
    </EmptyState>

    <template v-else>
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <!-- 左：播放器与剧集 -->
        <div class="min-w-0">
          <PlayerStage
            :key="playerKey + currentEp?.url"
            :url="currentEp?.url || ''"
            :title="detail.name"
            :start-at="startAt"
            :rate="settings.settings.defaultRate"
            @progress="saveProgress"
            @ended="onEnded"
            @error="playerError = true"
          />

          <!-- 播放失败提示 -->
          <div
            v-if="playerError"
            class="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-tangerine/40 bg-tangerine/10 px-4 py-3 text-sm"
          >
            <span class="text-ink">视频加载失败，可能是源线路波动。</span>
            <button class="btn-ghost inline-flex items-center gap-1 px-3 py-1 text-xs" @click="retryPlayer">
              <RotateCcw class="size-3" /> 重试
            </button>
            <button class="btn-primary inline-flex items-center gap-1 px-3 py-1 text-xs" @click="loadAlternates">
              <Layers class="size-3" /> 换个源
            </button>
          </div>

          <!-- 操作条 -->
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <button
              class="btn-ghost inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-40"
              :disabled="epIdx <= 0"
              @click="goEp(-1)"
            >
              <SkipBack class="size-4" /> 上一集
            </button>
            <button
              class="btn-ghost inline-flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-40"
              :disabled="epIdx >= episodes.length - 1"
              @click="goEp(1)"
            >
              <SkipForward class="size-4" /> 下一集
            </button>
            <button
              v-if="isDrama"
              class="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition"
              :class="
                settings.settings.dramaContinuous
                  ? 'border-transparent bg-brand text-paper shadow-soft'
                  : 'border-line text-ink2'
              "
              @click="settings.patch({ dramaContinuous: !settings.settings.dramaContinuous })"
            >
              <Zap class="size-4" :fill="settings.settings.dramaContinuous ? 'currentColor' : 'none'" />
              连播{{ settings.settings.dramaContinuous ? '中' : '关' }}
            </button>
            <button
              class="btn-ghost ml-auto inline-flex items-center gap-1.5 px-4 py-2 text-sm"
              :class="{ '!border-tangerine text-tangerine': library.isFav(detail.sourceId, detail.vodId) }"
              @click="
                library.toggleFav({
                  sourceId: detail.sourceId,
                  vodId: detail.vodId,
                  name: detail.name,
                  pic: detail.pic,
                  remarks: detail.remarks,
                  typeName: detail.typeName,
                })
              "
            >
              <Heart class="size-4" :fill="library.isFav(detail.sourceId, detail.vodId) ? 'currentColor' : 'none'" />
              {{ library.isFav(detail.sourceId, detail.vodId) ? '已收藏' : '收藏' }}
            </button>
          </div>

          <!-- 换源面板 -->
          <div v-if="showSwitch" class="card-surface mt-4 p-4 fade-in">
            <p class="mb-3 text-sm font-bold text-ink">
              换个源看「{{ detail.name }}」
              <span class="ml-2 text-xs font-normal text-ink2">同一部片，不同线路</span>
            </p>
            <p v-if="findingAlt" class="animate-pulse text-sm text-ink2">正在扫描其他源…</p>
            <div v-else-if="alternates.length" class="flex flex-wrap gap-2">
              <button
                v-for="a in alternates"
                :key="a.sourceId"
                class="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition hover:border-brand hover:text-brand"
                @click="switchTo(a)"
              >
                <Play class="size-3.5" /> {{ a.name }}
                <span class="text-xs text-ink2">{{ a.remarks }}</span>
              </button>
            </div>
            <p v-else class="text-sm text-ink2">其他源暂时没有这部片。</p>
          </div>

          <!-- 播放来源分组 -->
          <div v-if="detail.playGroups.length > 1" class="mt-6 flex flex-wrap items-center gap-2">
            <span class="text-xs font-bold text-ink2">播放线路</span>
            <button
              v-for="(g, i) in detail.playGroups"
              :key="g.from"
              class="rounded-full border px-3.5 py-1.5 text-xs transition"
              :class="
                i === groupIdx
                  ? 'border-brand bg-brand text-paper font-bold'
                  : 'border-line text-ink2 hover:border-brand/60 hover:text-brand'
              "
              @click="groupIdx = i"
            >
              线路{{ i + 1 }} · {{ g.from }}
            </button>
          </div>

          <!-- 剧集 -->
          <section v-if="episodes.length > 1" class="mt-6">
            <h2 class="mb-3 font-display text-xl font-bold text-ink">选集</h2>
            <EpisodeGrid :episodes="episodes" :active="epIdx" @select="(i) => (epIdx = i)" />
          </section>
        </div>

        <!-- 右：影片信息 -->
        <aside class="space-y-4">
          <div class="card-surface overflow-hidden fade-in">
            <div class="flex gap-4 p-4">
              <img
                :src="detail.pic"
                :alt="detail.name"
                referrerpolicy="no-referrer"
                class="h-44 w-28 shrink-0 rounded-xl object-cover shadow-soft"
              />
              <div class="min-w-0">
                <h1 class="font-display text-xl font-black leading-snug text-ink">
                  {{ detail.name }}
                </h1>
                <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink2">
                  <span v-if="detail.score" class="font-bold text-gold">{{ detail.score }} 分</span>
                  <span v-if="detail.year">{{ detail.year }}</span>
                  <span v-if="detail.area">{{ detail.area }}</span>
                  <span v-if="detail.typeName">{{ detail.typeName }}</span>
                </div>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  <span
                    v-for="t in detail.tags || []"
                    :key="t"
                    class="rounded-full bg-sage/15 px-2 py-0.5 text-[11px] text-brand"
                  >
                    {{ t }}
                  </span>
                </div>
                <div class="mt-2">
                  <SourceBadge :name="source?.name || detail.sourceId" />
                </div>
              </div>
            </div>
            <p v-if="detail.content" class="border-t border-line/60 px-4 py-3 text-sm leading-relaxed text-ink2">
              {{ detail.content.slice(0, 160) }}{{ detail.content.length > 160 ? '…' : '' }}
            </p>
            <dl v-if="detail.actor || detail.director" class="space-y-1 border-t border-line/60 px-4 py-3 text-xs leading-relaxed text-ink2">
              <div v-if="detail.director"><dt class="inline font-bold text-ink">导演：</dt>{{ detail.director }}</div>
              <div v-if="detail.actor"><dt class="inline font-bold text-ink">主演：</dt>{{ detail.actor }}</div>
            </dl>
          </div>
        </aside>
      </div>

      <!-- 相关推荐 -->
      <section v-if="related.length" class="mt-12">
        <h2 class="mb-4 font-display text-xl font-bold text-ink md:text-2xl">看了还想看</h2>
        <MediaGrid :works="related" :loading="relatedLoading && !related.length" :skeletons="6" />
      </section>
    </template>
  </div>
</template>
