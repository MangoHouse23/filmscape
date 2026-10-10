import { ref, watch, type Ref } from 'vue'

const PREFIX = 'filmscape:'

/** localStorage 持久化 ref */
export function persisted<T>(key: string, initial: T): Ref<T> {
  const fullKey = PREFIX + key
  let value = initial
  try {
    const raw = localStorage.getItem(fullKey)
    if (raw !== null) value = JSON.parse(raw) as T
  } catch {
    /* 忽略坏数据，使用初始值 */
  }
  const r = ref(value) as Ref<T>
  watch(
    r,
    (v) => {
      try {
        localStorage.setItem(fullKey, JSON.stringify(v))
      } catch {
        /* 存储满时静默失败 */
      }
    },
    { deep: true },
  )
  return r
}
