import { computed } from 'vue'
import { useLibraryStore } from '@/stores/library'
import type { Work } from '@/types'

/**
 * 轻个性化推荐（纯本地计算）：
 * 统计观看历史/收藏中的类型偏好，对候选池加权排序；
 * 无历史时退化为高分优先的热门榜单。
 */
export function useRecommend(pool: () => Work[]) {
  const library = useLibraryStore()

  return computed(() => {
    const candidates = pool().filter(
      (w) => !library.history.some((h) => h.name === w.name) && w.pic,
    )
    if (!candidates.length) return []

    // 统计类型偏好权重
    const weights = new Map<string, number>()
    const bump = (name?: string, w = 1) => {
      if (!name) return
      weights.set(name, (weights.get(name) || 0) + w)
    }
    library.history.forEach((h, i) => bump(h.typeName, Math.max(1, 8 - i * 0.5)))
    library.favorites.forEach((f) => bump(f.typeName, 10))

    const hasPref = weights.size > 0
    const scored = candidates.map((w, i) => {
      let score = w.score ? Number(w.score) : 0
      if (hasPref) {
        score += (weights.get(w.typeName || '') || 0) * 2
        if (w.tags) score += w.tags.reduce((s, t) => s + (weights.get(t) || 0), 0) * 0.5
        // 轻微打散，避免每次完全一致
        score += ((i * 37) % 7) * 0.1
      }
      return { w, score }
    })

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((s) => s.w)
  })
}
