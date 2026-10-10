import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLibraryStore } from '@/stores/library'
import { useRecommend } from './useRecommend'
import type { Work } from '@/types'

// node 环境下补齐 localStorage
const storage = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => storage.set(k, v),
  removeItem: (k: string) => storage.delete(k),
})

function work(name: string, typeName: string, score = '6'): Work {
  return { sourceId: 's', vodId: name.length, key: name, name, pic: 'p', typeName, score }
}

describe('useRecommend 本地推荐', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    storage.clear()
  })

  it('无历史时按评分排序', () => {
    const pool = [work('A', '动作片', '6'), work('B', '科幻片', '9'), work('C', '喜剧片', '7.5')]
    const rec = useRecommend(() => pool)
    expect(rec.value.map((w) => w.name)).toEqual(['B', 'C', 'A'])
  })

  it('有历史时偏好类型加权置顶', () => {
    const library = useLibraryStore()
    library.saveProgress({
      sourceId: 's',
      vodId: 1,
      name: '看过的科幻',
      pic: 'p',
      typeName: '科幻片',
      episodeIndex: 0,
      episodeName: '第01集',
      position: 100,
      duration: 1000,
    })
    const pool = [work('A', '动作片', '9'), work('B', '科幻片', '5'), work('C', '科幻片', '6')]
    const rec = useRecommend(() => pool)
    expect(rec.value[0].typeName).toBe('科幻片')
    expect(rec.value.some((w) => w.name === '看过的科幻')).toBe(false)
  })

  it('过滤已看过的影片', () => {
    const library = useLibraryStore()
    library.saveProgress({
      sourceId: 's',
      vodId: 2,
      name: 'B',
      pic: 'p',
      typeName: '科幻片',
      episodeIndex: 0,
      episodeName: '正片',
      position: 50,
      duration: 1000,
    })
    const pool = [work('A', '动作片'), work('B', '科幻片')]
    const rec = useRecommend(() => pool)
    expect(rec.value.map((w) => w.name)).toEqual(['A'])
  })
})
