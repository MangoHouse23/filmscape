import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Inspector from 'unplugin-vue-dev-locator/vite'
import { DEFAULT_SOURCES } from './src/api/sources'

/** 开发代理缓存 */
const proxyCache = new Map<string, { t: number; body: string }>()
const PROXY_CACHE_TTL = 5 * 60 * 1000

/**
 * CMS 代理中间件：/api/source/{sid}?... → 转发到对应采集源
 * 自定义源通过 &u=<base64(api)> 透传
 */
function cmsProxyPlugin(): Plugin {
  return {
    name: 'cms-proxy',
    configureServer(server) {
      server.middlewares.use('/api/source', async (req, res) => {
        try {
          const url = req.url || ''
          const sid = decodeURIComponent(url.split('?')[0].replace(/^\//, ''))
          const query = new URLSearchParams(url.split('?')[1] || '')
          let target: string | undefined = DEFAULT_SOURCES.find((s) => s.id === sid)?.api
          if (!target && query.get('u')) {
            try {
              const decoded = decodeURIComponent(escape(atob(query.get('u') as string)))
              if (/^https?:\/\//.test(decoded)) target = decoded
            } catch {
              /* 非法 base64 忽略 */
            }
          }
          if (!target) {
            res.statusCode = 404
            res.end(JSON.stringify({ code: 404, msg: 'unknown source' }))
            return
          }
          query.delete('u')
          const upstreamUrl = `${target}?${query.toString()}`
          const cacheKey = upstreamUrl
          const hit = proxyCache.get(cacheKey)
          if (hit && Date.now() - hit.t < PROXY_CACHE_TTL) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(hit.body)
            return
          }
          const upstream = await fetch(upstreamUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
          })
          const body = await upstream.text()
          proxyCache.set(cacheKey, { t: Date.now(), body })
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(body)
        } catch (e) {
          res.statusCode = 502
          res.end(JSON.stringify({ code: 502, msg: 'upstream error' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // 相对路径 base：hash 路由下 GitHub Pages 子路径 / 任意静态目录均可用
  base: './',
  build: {
    sourcemap: 'hidden',
  },
  plugins: [vue(), Inspector(), cmsProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // ✅ 定义 @ = src
    },
  },
})
