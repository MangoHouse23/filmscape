import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ChannelView from '@/views/ChannelView.vue'
import ShortDramaView from '@/views/ShortDramaView.vue'
import SearchView from '@/views/SearchView.vue'
import PlayView from '@/views/PlayView.vue'
import TheaterView from '@/views/TheaterView.vue'
import LibraryView from '@/views/LibraryView.vue'
import NotFound from '@/views/NotFound.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/channel/shortdrama', name: 'shortdrama', component: ShortDramaView },
  { path: '/channel/:channel', name: 'channel', component: ChannelView },
  { path: '/ai', redirect: { path: '/channel/shortdrama', query: { tab: 'ai' } } },
  { path: '/search', name: 'search', component: SearchView },
  { path: '/play/:sourceId/:vodId', name: 'play', component: PlayView },
  { path: '/theater/:sourceId/:vodId', name: 'theater', component: TheaterView },
  { path: '/library', name: 'library', component: LibraryView },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
]

const router = createRouter({
  // hash 模式：GitHub Pages / 任意静态托管零配置可用
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
