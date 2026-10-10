/** 开源 CMS 采集源配置（苹果CMS V10 JSON 协议，可自由增删） */

export interface VodSource {
  id: string;
  name: string;
  api: string;
  /** 用户自定义源（走 &u= base64 透传代理） */
  custom?: boolean;
}

export const DEFAULT_SOURCES: VodSource[] = [
  { id: 'jisu', name: '极速资源', api: 'https://jszyapi.com/api.php/provide/vod' },
  { id: 'bfzy', name: '暴风资源', api: 'https://bfzyapi.com/api.php/provide/vod' },
  { id: 'tyyszy', name: '天涯资源', api: 'https://tyyszy.com/api.php/provide/vod' },
  { id: 'ffzy', name: '非凡资源', api: 'https://ffzy5.tv/api.php/provide/vod' },
  { id: 'liangzi', name: '量子资源', api: 'https://cj.lziapi.com/api.php/provide/vod' },
  { id: 'dyttzy', name: '电影天堂', api: 'https://caiji.dyttzyapi.com/api.php/provide/vod' },
];

export type ChannelKey = 'movie' | 'tv' | 'show' | 'anime' | 'shortdrama';

export interface ChannelMeta {
  key: ChannelKey;
  name: string;
  /** 该频道的 CMS 分类名匹配规则 */
  match: (typeName: string) => boolean;
  /** 主分类候选名（优先精确匹配） */
  primaryNames: string[];
}

/** 频道匹配按顺序判定：短剧 > 动漫 > 综艺 > 电影 > 电视剧 */
export const CHANNELS: ChannelMeta[] = [
  {
    key: 'shortdrama',
    name: '短剧场',
    // 真人短剧池：排除 AI 制作分类（ai短剧 等走 AI 短剧 tab）
    match: (n) => (n.includes('短剧') || n.includes('短劇')) && !/ai/i.test(n),
    primaryNames: ['短剧', '短剧大全', '短剧场', '竖屏短剧', '真人短剧'],
  },
  {
    key: 'anime',
    name: '动漫',
    match: (n) => n.includes('动漫') || n.includes('动画') || n.includes('番剧') || n.includes('国漫') || n.includes('日漫'),
    primaryNames: ['动漫', '动画', '日韩动漫', '国产动漫'],
  },
  {
    key: 'show',
    name: '综艺',
    match: (n) => n.includes('综艺') || n.includes('演唱会'),
    primaryNames: ['综艺', '综艺片', '演唱会'],
  },
  {
    key: 'movie',
    name: '电影',
    match: (n) =>
      (n.includes('电影') || n.endsWith('片')) &&
      !n.includes('动画') &&
      !n.includes('动漫') &&
      !n.includes('综艺') &&
      !n.includes('短剧'),
    primaryNames: ['电影', '电影片'],
  },
  {
    key: 'tv',
    name: '电视剧',
    match: (n) =>
      n.includes('电视剧') ||
      n.includes('连续剧') ||
      (n.includes('剧') && !n.includes('短剧') && !n.includes('动漫') && !n.includes('动画') && !n.includes('综艺')),
    primaryNames: ['电视剧', '连续剧'],
  },
];

export function channelByKey(key: string): ChannelMeta | undefined {
  return CHANNELS.find((c) => c.key === key);
}

/** AI 专项分类聚合为空时的兜底搜索关键词（AI 制作的短剧/漫剧） */
export const AI_KEYWORDS = ['AI短剧', 'AI漫剧', '漫剧'];

/** 首页搜索热词（静态运营位） */
export const HOT_KEYWORDS = ['庆余年', '三体', '狂飙', '哪吒', '凡人修仙传', '漂白', '玫瑰的故事', '斗罗大陆'];
