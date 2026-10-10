import { describe, expect, it } from 'vitest'
import { formOf, genresOf, topGenres } from './genres'
import type { Work } from '@/types'

function w(over: Partial<Work> = {}): Work {
  return {
    sourceId: 's1',
    vodId: 1,
    key: 'x',
    name: '测试',
    pic: '',
    ...over,
  }
}

describe('genresOf 题材推断', () => {
  it('按片名关键词归类', () => {
    expect(genresOf(w({ name: '替嫁当后娘侯门主母养崽逆袭' }))).toEqual(
      expect.arrayContaining(['逆袭', '古风权谋', '萌宝亲情']),
    )
    expect(genresOf(w({ name: '重生90，我要当首富' }))).toContain('穿越重生')
  })
  it('取源内标签但过滤 AI 元标签', () => {
    const g = genresOf(w({ name: '无名剧', tags: ['AI漫剧', '恋爱'] }))
    expect(g).toContain('恋爱')
    expect(g).not.toContain('AI漫剧')
  })
})

describe('formOf 形态判断', () => {
  it('按分类名区分漫剧/短剧', () => {
    expect(formOf(w({ typeName: 'AI漫剧' }))).toBe('漫剧')
    expect(formOf(w({ typeName: 'ai短剧' }))).toBe('短剧')
    expect(formOf(w({ typeName: '电影' }))).toBe('')
  })
})

describe('topGenres 题材统计', () => {
  it('按出现次数排序取 top', () => {
    const works = [
      w({ name: '逆袭之最强腰王' }),
      w({ name: '我又逆袭了' }),
      w({ name: '甜宠婚恋故事' }),
    ]
    const top = topGenres(works)
    expect(top[0]).toBe('逆袭')
    expect(top).toContain('甜宠婚恋')
  })
})
