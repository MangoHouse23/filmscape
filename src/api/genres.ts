/**
 * 红果式题材推断（共享给 AI 剧场 / 真人短剧页）：
 * 采集源大多不带题材标签，先取源内标签（过滤 AI 元标签），再按片名关键词归类。
 */
import type { Work } from '@/types'

export const GENRE_RULES: Array<{ tag: string; re: RegExp }> = [
  { tag: '逆袭', re: /逆袭|崛起|翻盘|从.{0,8}(开始|到)|家奴|落榜/ },
  { tag: '穿越重生', re: /穿越|穿书|重生|转生|回到|前世/ },
  { tag: '甜宠婚恋', re: /甜宠|恋爱|爱情|相亲|闺蜜|婚|嫁|新娘|分手/ },
  { tag: '总裁豪门', re: /总裁|豪门|富二代|千金|首富|弃妇|认亲|沈总|陆总/ },
  { tag: '古风权谋', re: /侯|帝|妃|王爷|嫡|郡主|将军|皇帝|皇宫|殿|府/ },
  { tag: '玄幻仙侠', re: /仙|魔|神|龙|天命|修炼|万古|之巅|山海/ },
  { tag: '科幻末世', re: /末世|科幻|机甲|星际|副本|丧尸|未来|AI/ },
  { tag: '萌宝亲情', re: /崽|萌宝|宝宝|娃娃|闺女|携/ },
  { tag: '悬疑', re: /谜|悬|案|罪|追凶|致命/ },
]

const META_TAG = /^(ai|短剧|漫剧|剧场|正片|动漫|动画|短大全)/i

/** 单部作品的题材列表（源内标签 + 片名推断，去重） */
export function genresOf(w: Work): string[] {
  const out = new Set<string>()
  for (const t of w.tags || []) if (!META_TAG.test(t)) out.add(t)
  for (const r of GENRE_RULES) if (r.re.test(w.name)) out.add(r.tag)
  return [...out]
}

/** 内容形态：短剧 / 漫剧（按分类名判断，其余返回空串） */
export function formOf(w: Work): string {
  const n = (w.typeName || '').toLowerCase()
  if (n.includes('漫')) return '漫剧'
  if (n.includes('短剧')) return '短剧'
  return ''
}

/** 统计作品池中 top 题材（按出现次数排序） */
export function topGenres(works: Work[], limit = 10): string[] {
  const m = new Map<string, number>()
  for (const w of works) for (const g of genresOf(w)) m.set(g, (m.get(g) || 0) + 1)
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([g]) => g)
}
