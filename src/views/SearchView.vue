<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Flame, Search, X } from 'lucide-vue-next'
import { searchAgg } from '@/api/cms'
import { HOT_KEYWORDS } from '@/api/sources'
import { useSourcesStore } from '@/stores/sources'
import { useLibraryStore } from '@/stores/library'
import MediaGrid from '@/components/MediaGrid.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { Work } from '@/types'

const sourcesStore = useSourcesStore()
const library = useLibraryStore()

const q = ref('')
const keyword = ref('')
const works = ref<Work[]>([])
const loading = ref(false)
const failedSources = ref<string[]>([])
const searched = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

async function doSearch(word?: string) {
  const w = (word ?? q.value).trim()
  if (!w) return
  q.value = w
  keyword.value = w
  library.addSearchHistory(w)
  loading.value = true
  searched.value = true
  try {
    const res = await searchAgg(w, sourcesStore.enabledSources)
    works.value = res.works
    failedSources.value = res.errors
  } finally {
    loading.value = false
  }
}

onMounted(() => inputEl.value?.focus())
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 pb-28 pt-8 md:px-6 lg:pb-16">
    <h1 class="mb-6 font-display text-3xl font-black text-ink rise-in">搜一部想看的</h1>

    <form
      class="flex gap-2 rise-in"
      @submit.prevent="doSearch()"
    >
      <div
        class="flex flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 shadow-soft transition focus-within:border-brand"
      >
        <Search class="size-4 shrink-0 text-ink2" />
        <input
          ref="inputEl"
          v-model="q"
          type="search"
          placeholder="片名 / 主演 / 关键词，如：庆余年"
          class="w-full bg-transparent text-sm outline-none placeholder:text-ink2/60"
        />
        <button v-if="q" type="button" aria-label="清空" @click="q = ''">
          <X class="size-4 text-ink2 hover:text-ink" />
        </button>
      </div>
      <button type="submit" class="btn-primary px-6 text-sm">搜一下</button>
    </form>

    <!-- 搜索历史 & 热词 -->
    <div v-if="!searched" class="mt-8 space-y-5 rise-in">
      <div v-if="library.searchHistory.length">
        <div class="mb-2 flex items-center justify-between">
          <p class="text-xs font-bold text-ink2">最近搜过</p>
          <button class="text-xs text-ink2 hover:text-tangerine" @click="library.clearSearchHistory()">
            清空
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="w in library.searchHistory"
            :key="w"
            class="rounded-full border border-line px-3.5 py-1.5 text-sm text-ink2 transition hover:border-brand hover:text-brand"
            @click="doSearch(w)"
          >
            {{ w }}
          </button>
        </div>
      </div>
      <div>
        <p class="mb-2 flex items-center gap-1 text-xs font-bold text-ink2">
          <Flame class="size-3.5 text-tangerine" /> 大家都在看
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="w in HOT_KEYWORDS"
            :key="w"
            class="rounded-full bg-sage/15 px-3.5 py-1.5 text-sm text-brand transition hover:bg-sage/30"
            @click="doSearch(w)"
          >
            {{ w }}
          </button>
        </div>
      </div>
    </div>

    <!-- 结果 -->
    <div v-else class="mt-8">
      <p class="mb-4 text-sm text-ink2">
        「<b class="text-ink">{{ keyword }}</b
        >」找到 <b class="text-tangerine">{{ works.length }}</b> 部作品
      </p>
      <MediaGrid :works="works" :loading="loading" />
      <EmptyState
        v-if="!loading && !works.length"
        title="没有找到相关影片"
        :desc="failedSources.length ? `部分源（${failedSources.join('、')}）暂时失联，可能影响了结果` : '换个关键词试试，比如主演名字或简称'"
      />
    </div>
  </div>
</template>
