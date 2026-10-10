<script setup lang="ts">
import { computed, ref } from 'vue'
import { Heart, History, Plus, Settings2, Trash2 } from 'lucide-vue-next'
import { useLibraryStore } from '@/stores/library'
import { useSettingsStore } from '@/stores/settings'
import { useSourcesStore } from '@/stores/sources'
import MediaGrid from '@/components/MediaGrid.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { Work } from '@/types'

const library = useLibraryStore()
const settings = useSettingsStore()
const sourcesStore = useSourcesStore()

type Tab = 'fav' | 'history' | 'settings'
const tab = ref<Tab>('fav')

const tabs: { key: Tab; label: string; icon: unknown }[] = [
  { key: 'fav', label: '我的收藏', icon: Heart },
  { key: 'history', label: '观看历史', icon: History },
  { key: 'settings', label: '偏好设置', icon: Settings2 },
]

const favWorks = computed<Work[]>(() =>
  library.favorites.map((f) => ({
    sourceId: f.sourceId,
    vodId: f.vodId,
    key: f.name,
    name: f.name,
    pic: f.pic,
    remarks: f.remarks,
    typeName: f.typeName,
  })),
)

/* 自定义源表单 */
const newName = ref('')
const newApi = ref('')
const formError = ref('')

function addSource() {
  const err = sourcesStore.addCustom(newName.value, newApi.value)
  formError.value = err || ''
  if (!err) {
    newName.value = ''
    newApi.value = ''
  }
}

function fmtTime(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtDur(s: number) {
  const m = Math.floor(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)}小时${m % 60}分` : `${m}分钟`
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 pb-28 pt-8 md:px-6 lg:pb-16">
    <h1 class="mb-6 font-display text-3xl font-black text-ink rise-in">我的拾光</h1>

    <!-- Tab 切换 -->
    <div class="mb-6 flex gap-2 rise-in">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition"
        :class="
          tab === t.key
            ? 'bg-brand text-paper font-bold shadow-soft'
            : 'border border-line text-ink2 hover:border-brand/50 hover:text-brand'
        "
        @click="tab = t.key"
      >
        <component :is="t.icon" class="size-4" />
        {{ t.label }}
      </button>
    </div>

    <!-- 收藏 -->
    <template v-if="tab === 'fav'">
      <MediaGrid v-if="library.favorites.length" :works="favWorks" />
      <EmptyState v-else title="还没有收藏" desc="看到心动的影片，点一下♥，它就会在这里等你。">
        <router-link to="/" class="btn-primary mt-2 px-6 py-2 text-sm">去逛逛</router-link>
      </EmptyState>
    </template>

    <!-- 历史 -->
    <template v-else-if="tab === 'history'">
      <template v-if="library.history.length">
        <div class="mb-4 flex justify-end">
          <button
            class="inline-flex items-center gap-1 text-sm text-ink2 transition hover:text-tangerine"
            @click="library.clearHistory()"
          >
            <Trash2 class="size-4" /> 清空历史
          </button>
        </div>
        <div class="space-y-3">
          <div
            v-for="h in library.history"
            :key="h.sourceId + h.vodId"
            class="card-surface flex items-center gap-4 p-3 transition hover:shadow-soft"
          >
            <router-link :to="`/play/${h.sourceId}/${h.vodId}`" class="shrink-0">
              <img
                :src="h.pic"
                :alt="h.name"
                referrerpolicy="no-referrer"
                class="h-20 w-14 rounded-lg object-cover"
              />
            </router-link>
            <div class="min-w-0 flex-1">
              <router-link :to="`/play/${h.sourceId}/${h.vodId}`">
                <p class="truncate font-bold text-ink hover:text-brand">{{ h.name }}</p>
              </router-link>
              <p class="mt-0.5 text-xs text-ink2">
                {{ h.episodeName }} · 看到{{ fmtDur(h.position) }} · {{ fmtTime(h.updatedAt) }}
              </p>
              <div class="mt-2 h-1 w-full max-w-xs rounded-full bg-line">
                <div
                  class="h-full rounded-full bg-tangerine"
                  :style="{ width: Math.min(100, Math.round((h.position / (h.duration || 1)) * 100)) + '%' }"
                ></div>
              </div>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-2">
              <router-link :to="`/play/${h.sourceId}/${h.vodId}?ep=${h.episodeIndex}`" class="btn-primary px-4 py-1.5 text-xs">
                续播
              </router-link>
              <button
                class="text-xs text-ink2 hover:text-tangerine"
                @click="library.removeHistory(h.sourceId, h.vodId)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </template>
      <EmptyState v-else title="暂无观看记录" desc="看完的每一部，都会记得你的进度。" />
    </template>

    <!-- 设置 -->
    <template v-else>
      <div class="max-w-2xl space-y-5">
        <!-- 播放偏好 -->
        <div class="card-surface p-5">
          <h2 class="mb-4 font-display text-lg font-bold text-ink">播放偏好</h2>
          <div class="space-y-4 text-sm">
            <label class="flex items-center justify-between gap-4">
              <span class="text-ink">主题外观</span>
              <button
                class="btn-ghost px-4 py-1.5 text-xs"
                @click="settings.toggleTheme()"
              >
                {{ settings.isDark ? '🌙 深夜墨绿' : '☀️ 清晨米白' }}
              </button>
            </label>
            <label class="flex items-center justify-between gap-4">
              <span class="text-ink">默认倍速</span>
              <select
                class="rounded-full border border-line bg-surface px-3 py-1.5 text-xs outline-none focus:border-brand"
                :value="settings.settings.defaultRate"
                @change="settings.patch({ defaultRate: Number(($event.target as HTMLSelectElement).value) })"
              >
                <option v-for="r in [0.75, 1, 1.25, 1.5, 2]" :key="r" :value="r">{{ r }}x</option>
              </select>
            </label>
            <label class="flex items-center justify-between gap-4">
              <span class="text-ink">自动播放下一集</span>
              <input
                type="checkbox"
                class="size-4 accent-[rgb(var(--rgb-brand))]"
                :checked="settings.settings.autoNext"
                @change="settings.patch({ autoNext: ($event.target as HTMLInputElement).checked })"
              />
            </label>
            <label class="flex items-center justify-between gap-4">
              <span class="text-ink">短剧沉浸连播</span>
              <input
                type="checkbox"
                class="size-4 accent-[rgb(var(--rgb-brand))]"
                :checked="settings.settings.dramaContinuous"
                @change="settings.patch({ dramaContinuous: ($event.target as HTMLInputElement).checked })"
              />
            </label>
          </div>
        </div>

        <!-- 数据源管理 -->
        <div class="card-surface p-5">
          <h2 class="mb-1 font-display text-lg font-bold text-ink">数据源管理</h2>
          <p class="mb-4 text-xs text-ink2">基于开源苹果CMS采集协议，可自由启停或添加新源（接口需兼容 /api.php/provide/vod）。</p>
          <div class="space-y-2">
            <div
              v-for="s in sourcesStore.allSources"
              :key="s.id"
              class="flex items-center justify-between gap-3 rounded-xl border border-line/70 px-3 py-2.5"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-ink">
                  {{ s.name }}
                  <span v-if="s.custom" class="ml-1 rounded bg-tangerine/15 px-1.5 text-[10px] text-tangerine">自定义</span>
                </p>
                <p class="truncate text-[11px] text-ink2">{{ s.api }}</p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <button
                  class="rounded-full px-3 py-1 text-xs font-bold transition"
                  :class="
                    sourcesStore.isEnabled(s.id)
                      ? 'bg-brand/10 text-brand'
                      : 'bg-line/60 text-ink2'
                  "
                  @click="sourcesStore.toggle(s.id)"
                >
                  {{ sourcesStore.isEnabled(s.id) ? '已启用' : '已停用' }}
                </button>
                <button
                  v-if="s.custom"
                  aria-label="删除源"
                  class="text-ink2 hover:text-tangerine"
                  @click="sourcesStore.removeCustom(s.id)"
                >
                  <Trash2 class="size-4" />
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4 space-y-2 rounded-xl bg-sage/10 p-3">
            <p class="flex items-center gap-1 text-xs font-bold text-brand"><Plus class="size-3.5" /> 添加自定义源</p>
            <input
              v-model="newName"
              placeholder="源名称，如：我的源"
              class="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <input
              v-model="newApi"
              placeholder="接口地址，如 https://example.com/api.php/provide/vod"
              class="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <p v-if="formError" class="text-xs text-tangerine">{{ formError }}</p>
            <button class="btn-primary px-5 py-2 text-xs" @click="addSource">添加</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
