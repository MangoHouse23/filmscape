/**
 * CMS 聚合适配层：
 * - 统一走 /api/source/{sid} 代理（Vite 中间件 / Vercel Function）
 * - 内存缓存（TTL 10 分钟）+ 超时控制 + 多源并发聚合（allSettled 容错）
 */
import type { AggResult, CmsClass, CmsItem, CmsListResp, Episode, PlayGroup, Work, WorkDetail } from '@/types'
import { AI_KEYWORDS, CHANNELS, channelByKey, type ChannelMeta, type VodSource } from './sources'

const CACHE_TTL = 10 * 60 * 1000
const FETCH_TIMEOUT = 20 * 1000

const cache = new Map<string, { t: number; data: CmsListResp }>()

/* ---------------- 基础请求 ---------------- */

export function buildProxyUrl(source: VodSource, params: Record<string, string | number>): string {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => qs.set(k, String(v)))
  if (source.custom) qs.set('u', btoa(unescape(encodeURIComponent(source.api))))
  return `/api/source/${encodeURIComponent(source.id)}?${qs.toString()}`
}

async function fetchList(source: VodSource, params: Record<string, string | number>): Promise<CmsListResp> {
  const key = `${source.id}?${JSON.stringify(params)}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.data

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(buildProxyUrl(source, params), { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as CmsListResp
    if (!data || (data.code !== undefined && data.code !== 1)) throw new Error('bad response')
    cache.set(key, { t: Date.now(), data })
    return data
  } finally {
    clearTimeout(timer)
  }
}

/* ---------------- 名称归一与合并 ---------------- */

export function normalizeName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/《|》|·|～|~|-|—|_|:|：|！|!|，|,|。|\s/g, '')
}

export function mapItem(sourceId: string, item: CmsItem): Work {
  return {
    sourceId,
    vodId: item.vod_id,
    key: normalizeName(item.vod_name),
    name: (item.vod_name || '').trim(),
    pic: item.vod_pic || '',
    year: item.vod_year || undefined,
    remarks: item.vod_remarks || undefined,
    typeName: item.type_name || undefined,
    score: item.vod_score && Number(item.vod_score) > 0 ? item.vod_score : undefined,
    tags: item.vod_class ? item.vod_class.split(',').filter(Boolean).slice(0, 4) : undefined,
    typeId: item.type_id || undefined,
  }
}

/** 多源去重合并：同名归一合并，优先保留有封面、有评分的条目 */
export function mergeWorks(items: Work[]): Work[] {
  const map = new Map<string, Work>()
  for (const w of items) {
    if (!w.name) continue
    const exist = map.get(w.key)
    if (!exist) {
      map.set(w.key, { ...w })
      continue
    }
    const betterPic = (!exist.pic && w.pic) || (w.score && !exist.score ? w.pic : exist.pic)
    map.set(w.key, {
      ...exist,
      pic: betterPic || exist.pic || w.pic,
      score: exist.score || w.score,
      remarks: exist.remarks || w.remarks,
      year: exist.year || w.year,
      typeName: exist.typeName || w.typeName,
    })
  }
  return [...map.values()]
}

function aggregate(
  settled: PromiseSettledResult<{ works: Work[]; total: number }>[],
  sources: VodSource[],
): AggResult {
  const works: Work[] = []
  const errors: string[] = []
  let total = 0
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      works.push(...r.value.works)
      total += r.value.total
    } else errors.push(sources[i]?.name || `源${i + 1}`)
  })
  return { works: mergeWorks(works), errors, total }
}

/* ---------------- 分类解析 ---------------- */

/** 按频道优先级匹配分类（短剧 > 动漫 > 综艺 > 电影 > 电视剧） */
export function matchChannel(typeName: string): ChannelMeta | undefined {
  return CHANNELS.find((c) => c.match(typeName))
}

export function pickPrimaryType(
  channel: ChannelMeta,
  classes: CmsClass[],
  subTypeName?: string,
): number | null {
  if (subTypeName) {
    const exact = classes.find((c) => c.type_name === subTypeName)
    if (exact) return exact.type_id
  }
  for (const name of channel.primaryNames) {
    const exact = classes.find((c) => c.type_name === name)
    if (exact) return exact.type_id
  }
  const first = classes.find((c) => channel.match(c.type_name))
  return first ? first.type_id : null
}

export async function fetchClasses(source: VodSource): Promise<CmsClass[]> {
  const data = await fetchList(source, { ac: 'list' })
  return data.class || []
}

/** 各频道可用子分类（跨源去重，用于筛选 chips） */
export async function fetchChannelSubTypes(channelKey: string, sources: VodSource[]): Promise<string[]> {
  const channel = channelByKey(channelKey)
  if (!channel) return []
  const settled = await Promise.allSettled(sources.map((s) => fetchClasses(s)))
  const names = new Set<string>()
  settled.forEach((r) => {
    if (r.status !== 'fulfilled') return
    r.value.forEach((c) => {
      if (channel.match(c.type_name)) names.add(c.type_name)
    })
  })
  return [...names].slice(0, 14)
}

/* ---------------- 频道列表 ---------------- */

/** 是否 AI 制作内容（按类型名/标签判断，如 ai短剧、AI漫剧） */
export function isAiWork(w: Work): boolean {
  return /ai/i.test(w.typeName || '') || (w.tags || []).some((t) => /ai/i.test(t))
}

export async function fetchChannelPage(
  channelKey: string,
  page: number,
  sources: VodSource[],
  subTypeName?: string,
): Promise<AggResult> {
  const channel = channelByKey(channelKey)
  if (!channel) return { works: [], errors: [] }

  const classList = await Promise.allSettled(sources.map((s) => fetchClasses(s)))

  const tasks = sources.map(async (s, i) => {
    const cls = classList[i].status === 'fulfilled' ? (classList[i] as PromiseFulfilledResult<CmsClass[]>).value : []
    const typeId = pickPrimaryType(channel, cls, subTypeName)
    if (!typeId) return { works: [], total: 0 }
    // 每次调用拉取两页（pg = page*2-1 / page*2），单次加载体量翻倍
    const pages = await Promise.allSettled([
      fetchList(s, { ac: 'videolist', t: typeId, pg: page * 2 - 1 }),
      fetchList(s, { ac: 'videolist', t: typeId, pg: page * 2 }),
    ])
    const items = pages.flatMap((r) => (r.status === 'fulfilled' ? r.value.list || [] : []))
    const okPage = pages.find((r): r is PromiseFulfilledResult<CmsListResp> => r.status === 'fulfilled')
    const total = okPage?.value.total ?? 0
    const works = items.map((it) => mapItem(s.id, it))
    // 真人短剧频道兜底过滤：防止部分源把 AI 短剧/漫剧混入短剧父分类
    return {
      works: channel.key === 'shortdrama' ? works.filter((w) => !isAiWork(w)) : works,
      total: total || items.length,
    }
  })

  return aggregate(await Promise.allSettled(tasks), sources)
}

/* ---------------- 搜索 ---------------- */

export async function searchAgg(keyword: string, sources: VodSource[]): Promise<AggResult> {
  const tasks = sources.map(async (s) => {
    const data = await fetchList(s, { ac: 'videolist', wd: keyword })
    const list = data.list || []
    return { works: list.map((it) => mapItem(s.id, it)), total: data.total || list.length }
  })
  return aggregate(await Promise.allSettled(tasks), sources)
}

/* ---------------- AI 短剧频道（源内 AI 专项分类聚合：AI 制作的短剧/漫剧） ---------------- */

/** 从分类列表识别 AI 专项分类 id（分类名含 ai 且含 剧/漫，如 ai短剧、AI漫剧） */
export function pickAiType(classes: CmsClass[]): number | null {
  const hit = classes.find((c) => /ai/i.test(c.type_name) && /剧|漫/.test(c.type_name))
  return hit ? hit.type_id : null
}

/** 剔除 AI 分类里混入的传统动画（vod_class 含"动画/动漫"且无 AI 标识） */
function isAiItem(it: CmsItem): boolean {
  return !(it.vod_class && /动画|动漫/.test(it.vod_class) && !/ai/i.test(it.vod_class))
}

export async function fetchAiPage(page: number, sources: VodSource[]): Promise<AggResult> {
  const classList = await Promise.allSettled(sources.map((s) => fetchClasses(s)))
  const aiTypes = new Map<string, number>()
  classList.forEach((r, i) => {
    if (r.status !== 'fulfilled') return
    const tid = pickAiType(r.value)
    if (tid) aiTypes.set(sources[i].id, tid)
  })

  const tasks = sources.map(async (s) => {
    const tid = aiTypes.get(s.id)
    if (!tid) return { works: [], total: 0 }
    // 每次调用拉取两页，单次加载体量翻倍
    const pages = await Promise.allSettled([
      fetchList(s, { ac: 'videolist', t: tid, pg: page * 2 - 1 }),
      fetchList(s, { ac: 'videolist', t: tid, pg: page * 2 }),
    ])
    const items = pages
      .flatMap((r) => (r.status === 'fulfilled' ? r.value.list || [] : []))
      .filter(isAiItem)
    const okPage = pages.find((r): r is PromiseFulfilledResult<CmsListResp> => r.status === 'fulfilled')
    const total = okPage?.value.total ?? 0
    return { works: items.map((it) => mapItem(s.id, it)), total: total || items.length }
  })
  const agg = aggregate(await Promise.allSettled(tasks), sources)
  if (agg.works.length || page > 1) return agg

  // 兜底：全部源均无 AI 专项分类/内容时，用 AI 关键词搜索
  return searchAgg(AI_KEYWORDS[0], sources)
}

/* ---------------- 详情 ---------------- */

export function stripHtml(html?: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim()
}

/** 解析 vod_play_from / vod_play_url 为播放分组 */
export function parsePlayGroups(item: CmsItem): PlayGroup[] {
  const froms = (item.vod_play_from || '').split('$$$').filter(Boolean)
  const urlGroups = (item.vod_play_url || '').split('$$$').filter(Boolean)
  return froms.map((from, i) => {
    const episodes: Episode[] = (urlGroups[i] || '')
      .split('#')
      .filter(Boolean)
      .map((seg) => {
        const idx = seg.lastIndexOf('$')
        return idx === -1
          ? { name: '正片', url: seg }
          : { name: seg.slice(0, idx).trim() || '正片', url: seg.slice(idx + 1) }
      })
    return { from, episodes }
  })
}

export function hasVideo(detail: WorkDetail): boolean {
  return detail.playGroups.some((g) => g.episodes.length > 0)
}

export async function fetchDetail(source: VodSource, vodId: number): Promise<WorkDetail> {
  const data = await fetchList(source, { ac: 'videolist', ids: vodId })
  const item = (data.list || [])[0]
  if (!item) throw new Error('未找到影片')
  return {
    ...mapItem(source.id, item),
    content: stripHtml(item.vod_content),
    area: item.vod_area || undefined,
    actor: item.vod_actor || undefined,
    director: item.vod_director || undefined,
    playGroups: parsePlayGroups(item),
  }
}

/** 相关推荐：同源同分类第一页，排除自身 */
export async function fetchRelated(source: VodSource, typeId: number, excludeId: number): Promise<Work[]> {
  const data = await fetchList(source, { ac: 'videolist', t: typeId, pg: 1 })
  return (data.list || [])
    .filter((it) => it.vod_id !== excludeId)
    .slice(0, 12)
    .map((it) => mapItem(source.id, it))
}

/** 换源：按名称跨源精确匹配 */
export async function findAlternateSources(
  name: string,
  excludeSourceId: string,
  sources: VodSource[],
): Promise<Work[]> {
  const key = normalizeName(name)
  const others = sources.filter((s) => s.id !== excludeSourceId)
  const tasks = others.map(async (s) => {
    const data = await fetchList(s, { ac: 'videolist', wd: name })
    return (data.list || [])
      .map((it) => mapItem(s.id, it))
      .filter((w) => w.key === key)
  })
  const settled = await Promise.allSettled(tasks)
  return settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}
