<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AlertTriangle } from 'lucide-vue-next'
import { fetchChannelPage, fetchChannelSubTypes } from '@/api/cms'
import { channelByKey } from '@/api/sources'
import { useSourcesStore } from '@/stores/sources'
import FilterChips from '@/components/FilterChips.vue'
import MediaGrid from '@/components/MediaGrid.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { Work } from '@/types'

const route = useRoute()
const sourcesStore = useSourcesStore()

const meta = computed(() => channelByKey(String(route.params.channel || '')))

const subTypes = ref<string[]>([])
const subType = ref('')
const works = ref<Work[]>([])
const page = ref(1)
const loading = ref(false)
const loadingMore = ref(false)
const exhausted = ref(false)
const failedSources = ref<string[]>([])

async function load(reset: boolean) {
  if (!meta.value) return
  if (reset) {
    page.value = 1
    exhausted.value = false
  }
  if (exhausted.value) return
  reset ? (loading.value = true) : (loadingMore.value = true)
  try {
    const res = await fetchChannelPage(
      meta.value.key,
      page.value,
      sourcesStore.enabledSources,
      subType.value || undefined,
    )
    failedSources.value = res.errors
    if (!res.works.length) exhausted.value = true
    works.value = reset ? res.works : [...works.value, ...res.works]
    if (res.works.length) page.value += 1
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

watch(
  () => route.params.channel,
  async () => {
    if (!meta.value) return
    subType.value = ''
    subTypes.value = []
    works.value = []
    load(true)
    fetchChannelSubTypes(meta.value.key, sourcesStore.enabledSources).then((list) => {
      subTypes.value = list
    })
  },
  { immediate: true },
)

watch(subType, () => load(true))
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 pb-28 pt-8 md:px-6 lg:pb-16">
    <template v-if="meta">
      <div class="mb-6 rise-in">
        <h1 class="font-display text-3xl font-black text-ink md:text-4xl">
          {{ meta.name }}
        </h1>
        <p class="mt-1 text-sm text-ink2">聚合 {{ sourcesStore.enabledSources.length }} 个开源采集源 · 免费无广告</p>
      </div>

      <div class="sticky top-16 z-30 -mx-4 bg-paper/85 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <FilterChips v-model="subType" :options="subTypes" />
      </div>

      <div class="mt-5">
        <MediaGrid :works="works" :loading="loading" align />
      </div>

      <EmptyState
        v-if="!loading && !works.length"
        title="这个频道暂时空空如也"
        :desc="failedSources.length ? `${failedSources.join('、')} 等源暂时失联，试试在「我的 → 数据源」切换其他源` : '换个分类或稍后再来看看'"
      />

      <div v-if="works.length" class="mt-8 flex justify-center">
        <button v-if="!exhausted" class="btn-ghost px-8 py-2.5 text-sm" :disabled="loadingMore" @click="load(false)">
          <span v-if="loadingMore" class="animate-pulse">加载中…</span>
          <span v-else>加载更多</span>
        </button>
        <p v-else class="text-sm text-ink2">— 到底啦，去发现别的片片吧 —</p>
      </div>

      <p
        v-if="failedSources.length && works.length"
        class="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink2"
      >
        <AlertTriangle class="size-3.5 text-tangerine" />
        {{ failedSources.join('、') }} 暂时失联，已自动跳过
      </p>
    </template>

    <EmptyState v-else title="频道不存在" desc="检查一下地址，或从导航重新进入。">
      <router-link to="/" class="btn-primary mt-2 px-6 py-2 text-sm">回到首页</router-link>
    </EmptyState>
  </div>
</template>
