import { defineStore } from 'pinia'
import { persisted } from './persist'
import type { FavRecord, HistoryRecord } from '@/types'

const MAX_HISTORY = 100
const MAX_SEARCH_HISTORY = 10

export const useLibraryStore = defineStore('library', () => {
  const history = persisted<HistoryRecord[]>('history', [])
  const favorites = persisted<FavRecord[]>('favorites', [])
  const searchHistory = persisted<string[]>('search-history', [])

  /* ---------- 历史 / 续播 ---------- */

  function saveProgress(rec: Omit<HistoryRecord, 'updatedAt'>) {
    if (!rec.name || rec.position < 3) return
    const rest = history.value.filter(
      (h) => !(h.sourceId === rec.sourceId && h.vodId === rec.vodId),
    )
    rest.unshift({ ...rec, updatedAt: Date.now() })
    history.value = rest.slice(0, MAX_HISTORY)
  }

  function getProgress(sourceId: string, vodId: number): HistoryRecord | undefined {
    return history.value.find((h) => h.sourceId === sourceId && h.vodId === vodId)
  }

  function removeHistory(sourceId: string, vodId: number) {
    history.value = history.value.filter((h) => !(h.sourceId === sourceId && h.vodId === vodId))
  }

  function clearHistory() {
    history.value = []
  }

  /* ---------- 收藏 ---------- */

  function isFav(sourceId: string, vodId: number): boolean {
    return favorites.value.some((f) => f.sourceId === sourceId && f.vodId === vodId)
  }

  function toggleFav(rec: Omit<FavRecord, 'createdAt'>) {
    if (isFav(rec.sourceId, rec.vodId)) {
      favorites.value = favorites.value.filter(
        (f) => !(f.sourceId === rec.sourceId && f.vodId === rec.vodId),
      )
    } else {
      favorites.value = [{ ...rec, createdAt: Date.now() }, ...favorites.value]
    }
  }

  /* ---------- 搜索历史 ---------- */

  function addSearchHistory(word: string) {
    const w = word.trim()
    if (!w) return
    searchHistory.value = [w, ...searchHistory.value.filter((x) => x !== w)].slice(0, MAX_SEARCH_HISTORY)
  }

  function clearSearchHistory() {
    searchHistory.value = []
  }

  return {
    history,
    favorites,
    searchHistory,
    saveProgress,
    getProgress,
    removeHistory,
    clearHistory,
    isFav,
    toggleFav,
    addSearchHistory,
    clearSearchHistory,
  }
})
