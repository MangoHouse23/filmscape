/**
 * Vercel Serverless Function（免费 Hobby 层即可）
 * 生产环境 CMS 代理：/api/source/{sid}?... → 采集源
 */
import { DEFAULT_SOURCES } from '../src/api/sources'

const CACHE_TTL = 5 * 60 * 1000
const cache = new Map()

export default async function handler(req, res) {
  try {
    const query = new URLSearchParams(req.url.split('?')[1] || '')
    const sid = query.get('sid') || ''
    let target = DEFAULT_SOURCES.find((s) => s.id === sid)?.api
    if (!target && query.get('u')) {
      const decoded = Buffer.from(query.get('u'), 'base64').toString('utf-8')
      if (/^https?:\/\//.test(decoded)) target = decoded
    }
    if (!target) {
      res.status(404).json({ code: 404, msg: 'unknown source' })
      return
    }
    query.delete('sid')
    query.delete('u')
    const upstreamUrl = `${target}?${query.toString()}`
    const hit = cache.get(upstreamUrl)
    if (hit && Date.now() - hit.t < CACHE_TTL) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.status(200).send(hit.body)
      return
    }
    const upstream = await fetch(upstreamUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    })
    const body = await upstream.text()
    cache.set(upstreamUrl, { t: Date.now(), body })
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(200).send(body)
  } catch {
    res.status(502).json({ code: 502, msg: 'upstream error' })
  }
}
