<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { FastForward } from 'lucide-vue-next'
import Artplayer from 'artplayer'
import Hls from 'hls.js'

const props = withDefaults(
  defineProps<{
    url: string
    title: string
    startAt?: number
    rate?: number
    skipIntroSeconds?: number
    /** wide：常规横屏；vertical：沉浸竖屏（高度由父级撑满，视频等比 contain） */
    variant?: 'wide' | 'vertical'
  }>(),
  { startAt: 0, rate: 1, skipIntroSeconds: 85, variant: 'wide' },
)

const emit = defineEmits<{
  (e: 'ended'): void
  (e: 'progress', position: number, duration: number): void
  (e: 'error'): void
  (e: 'ready'): void
}>()

const container = ref<HTMLDivElement | null>(null)
const showSkip = ref(false)
let art: any = null
let lastSaved = 0
let resumed = false

function playM3u8(video: HTMLVideoElement, url: string, instance: any) {
  if (Hls.isSupported()) {
    if (instance.hls) instance.hls.destroy()
    const hls = new Hls()
    hls.loadSource(url)
    hls.attachMedia(video)
    instance.hls = hls
    instance.on('destroy', () => hls.destroy())
    hls.on(Hls.Events.ERROR, (_evt: unknown, data: any) => {
      if (data?.fatal) emit('error')
    })
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url
  } else {
    emit('error')
  }
}

function createPlayer(url: string) {
  if (!container.value) return
  art = new Artplayer({
    container: container.value,
    url,
    type: url.includes('m3u8') ? 'm3u8' : '',
    customType: { m3u8: playM3u8 },
    volume: 0.8,
    autoplay: true,
    pip: true,
    setting: true,
    aspectRatio: true,
    flip: true,
    fullscreen: true,
    fullscreenWeb: true,
    miniProgressBar: true,
    mutex: true,
    lang: 'zh-cn',
    moreVideoAttr: { playsInline: true },
    settings: [
      {
        html: '倍速播放',
        width: 150,
        tooltip: `${props.rate}x`,
        selector: [0.5, 0.75, 1, 1.25, 1.5, 2, 3].map((r) => ({ html: `${r}x`, rate: r })),
        onSelect(item: any) {
          art.playbackRate = item.rate
          return item.html
        },
      },
    ],
  })

  art.on('ready', () => {
    art.playbackRate = props.rate
    if (!resumed && props.startAt > 15) {
      art.seek = props.startAt
      art.notice.show = '已恢复上次观看进度'
    }
    resumed = true
    emit('ready')
  })

  art.on('video:timeupdate', () => {
    const pos = art.currentTime || 0
    const dur = art.duration || 0
    showSkip.value = pos > 0 && pos < 150 && dur > 300
    if (Date.now() - lastSaved > 5000 && pos > 3) {
      lastSaved = Date.now()
      emit('progress', pos, dur)
    }
  })

  art.on('video:ended', () => emit('ended'))
  art.on('error', () => emit('error'))
}

function skipIntro() {
  if (art) art.seek = props.skipIntroSeconds
  showSkip.value = false
}

onMounted(() => createPlayer(props.url))

watch(
  () => props.url,
  (next, prev) => {
    if (!art || next === prev) return
    resumed = false
    lastSaved = 0
    art.switchUrl(next)
  },
)

onBeforeUnmount(() => {
  if (art) {
    art.destroy(false)
    art = null
  }
})
</script>

<template>
  <div class="relative">
    <div
      ref="container"
      :class="
        variant === 'vertical'
          ? 'theater-stage h-full w-full overflow-hidden bg-black'
          : 'aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lift'
      "
      :aria-label="title"
    ></div>
    <transition name="fade-in">
      <button
        v-if="showSkip"
        class="absolute bottom-20 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-black/85 md:bottom-16"
        @click="skipIntro"
      >
        <FastForward class="size-3.5" />
        跳过片头
      </button>
    </transition>
  </div>
</template>

<style scoped>
/* 竖屏沉浸模式：视频等比缩放不裁切不拉伸 */
.theater-stage :deep(video) {
  object-fit: contain;
}
</style>
