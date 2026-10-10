/** 苹果CMS V10 数据结构 */

export interface CmsClass {
  type_id: number;
  type_name: string;
}

export interface CmsItem {
  vod_id: number;
  type_id: number;
  type_name: string;
  vod_name: string;
  vod_pic: string;
  vod_year?: string;
  vod_area?: string;
  vod_actor?: string;
  vod_director?: string;
  vod_remarks?: string;
  vod_content?: string;
  vod_score?: string;
  vod_class?: string;
  vod_time?: string;
  vod_play_from?: string;
  vod_play_url?: string;
}

export interface CmsListResp {
  code: number;
  total?: number;
  page?: number;
  pagecount?: number;
  limit?: number;
  class?: CmsClass[];
  list?: CmsItem[];
}

/** 归一后的作品（列表卡片用） */
export interface Work {
  sourceId: string;
  vodId: number;
  /** 归一化名称，用于多源去重 */
  key: string;
  name: string;
  pic: string;
  year?: string;
  remarks?: string;
  typeName?: string;
  score?: string;
  tags?: string[];
  /** 源内分类 id，用于相关推荐 */
  typeId?: number;
}

export interface Episode {
  name: string;
  url: string;
}

export interface PlayGroup {
  from: string;
  episodes: Episode[];
}

/** 详情页数据 */
export interface WorkDetail extends Work {
  content?: string;
  area?: string;
  actor?: string;
  director?: string;
  playGroups: PlayGroup[];
}

/** 聚合结果 */
export interface AggResult {
  works: Work[];
  errors: string[];
  /** 各源片库总量合计（源端真实总数，去重前） */
  total?: number;
}

/** 本地持久化记录 */
export interface HistoryRecord {
  sourceId: string;
  vodId: number;
  name: string;
  pic: string;
  typeName?: string;
  episodeIndex: number;
  episodeName: string;
  position: number;
  duration: number;
  updatedAt: number;
}

export interface FavRecord {
  sourceId: string;
  vodId: number;
  name: string;
  pic: string;
  remarks?: string;
  typeName?: string;
  createdAt: number;
}

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  defaultRate: number;
  autoNext: boolean;
  dramaContinuous: boolean;
}
