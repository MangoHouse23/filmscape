import { describe, expect, it } from 'vitest'
import {
  isAiWork,
  mapItem,
  matchChannel,
  mergeWorks,
  normalizeName,
  parsePlayGroups,
  pickPrimaryType,
  stripHtml,
} from './cms'
import { CHANNELS } from './sources'
import type { CmsItem, Work } from '@/types'

function item(over: Partial<CmsItem> = {}): CmsItem {
  return {
    vod_id: 1,
    type_id: 6,
    type_name: '动作片',
    vod_name: '测试影片',
    vod_pic: 'http://img/a.jpg',
    ...over,
  }
}

describe('normalizeName', () => {
  it('去空格/标点/书名号并转小写', () => {
    expect(normalizeName('《流浪 地球 2》')).toBe('流浪地球2')
    expect(normalizeName('庆余年（第一季）')).toBe('庆余年')
    expect(normalizeName('Hello：World!')).toBe('helloworld')
  })
})

describe('matchChannel 分类路由', () => {
  it('短剧优先于电影/电视剧规则', () => {
    expect(matchChannel('短剧')?.key).toBe('shortdrama')
    expect(matchChannel('竖屏短剧')?.key).toBe('shortdrama')
  })
  it('动画电影归入动漫', () => {
    expect(matchChannel('动画电影')?.key).toBe('anime')
    expect(matchChannel('国产动漫')?.key).toBe('anime')
  })
  it('剧情片归入电影，国产剧归入电视剧，综艺归入综艺', () => {
    expect(matchChannel('剧情片')?.key).toBe('movie')
    expect(matchChannel('爱情片')?.key).toBe('movie')
    expect(matchChannel('国产剧')?.key).toBe('tv')
    expect(matchChannel('香港剧')?.key).toBe('tv')
    expect(matchChannel('综艺节目')?.key).toBe('show')
    expect(matchChannel('演唱会')?.key).toBe('show')
  })
  it('AI 制作分类不归真人短剧频道', () => {
    expect(matchChannel('ai短剧')?.key).not.toBe('shortdrama')
    expect(matchChannel('AI漫剧')?.key).not.toBe('shortdrama')
  })
})

describe('pickPrimaryType', () => {
  const classes = [
    { type_id: 1, type_name: '电影' },
    { type_id: 2, type_name: '动作片' },
    { type_id: 20, type_name: '短剧' },
  ]
  it('优先精确主分类', () => {
    const movie = CHANNELS.find((c) => c.key === 'movie')!
    expect(pickPrimaryType(movie, classes)).toBe(1)
  })
  it('子分类筛选按名称匹配', () => {
    const movie = CHANNELS.find((c) => c.key === 'movie')!
    expect(pickPrimaryType(movie, classes, '动作片')).toBe(2)
  })
  it('无匹配返回 null', () => {
    const tv = CHANNELS.find((c) => c.key === 'tv')!
    expect(pickPrimaryType(tv, classes)).toBeNull()
  })
})

describe('parsePlayGroups', () => {
  it('解析单线路多集', () => {
    const g = parsePlayGroups(
      item({ vod_play_from: 'heimuer3', vod_play_url: '第01集$http://v/1#第02集$http://v/2' }),
    )
    expect(g).toHaveLength(1)
    expect(g[0].from).toBe('heimuer3')
    expect(g[0].episodes).toEqual([
      { name: '第01集', url: 'http://v/1' },
      { name: '第02集', url: 'http://v/2' },
    ])
  })
  it('解析多线路', () => {
    const g = parsePlayGroups(
      item({
        vod_play_from: 'a$$$b',
        vod_play_url: '第01集$http://v/a1$$$第01集$http://v/b1#第02集$http://v/b2',
      }),
    )
    expect(g).toHaveLength(2)
    expect(g[1].episodes).toHaveLength(2)
  })
  it('无 $ 分隔的裸链接兜底', () => {
    const g = parsePlayGroups(item({ vod_play_from: 'x', vod_play_url: 'http://v/movie.mp4' }))
    expect(g[0].episodes[0]).toEqual({ name: '正片', url: 'http://v/movie.mp4' })
  })
})

describe('mergeWorks 多源去重', () => {
  it('同名合并且补齐缺失字段', () => {
    const a: Work = mapItem('s1', item({ vod_score: '8.5' }))
    const b: Work = mapItem('s2', item({ vod_id: 9, vod_pic: '' }))
    const merged = mergeWorks([a, b])
    expect(merged).toHaveLength(1)
    expect(merged[0].pic).toBe('http://img/a.jpg')
    expect(merged[0].score).toBe('8.5')
  })
  it('过滤无名条目', () => {
    expect(mergeWorks([mapItem('s1', item({ vod_name: '' }))])).toHaveLength(0)
  })
})

describe('isAiWork AI 内容识别', () => {
  it('按类型名与标签判断', () => {
    expect(isAiWork(mapItem('s1', item({ type_name: 'ai短剧' })))).toBe(true)
    expect(isAiWork(mapItem('s1', item({ type_name: '短剧', vod_class: 'AI漫剧,AI漫' })))).toBe(true)
    expect(isAiWork(mapItem('s1', item({ type_name: '短剧' })))).toBe(false)
  })
})

describe('stripHtml', () => {
  it('清洗 HTML 与实体', () => {
    expect(stripHtml('<p>你好&nbsp;&amp; 欢迎</p>')).toBe('你好 & 欢迎')
    expect(stripHtml(undefined)).toBe('')
  })
})
