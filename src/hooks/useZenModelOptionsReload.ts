import { useEffect, useState } from 'react'
import { isOpenAICompatApiMode } from 'src/services/api/openaiCompat/config.js'
import {
  isZenFreeModelsFeatureEnabled,
  refreshZenFreeModelList,
} from 'src/services/api/openaiCompat/zenFreeModels.js'

/**
 * Zen 模型列表异步拉取完成后递增 tick，供 ModelPicker 等重新执行 getModelOptions()。
 * （否则首屏缓存的选项里没有 zen/*，且 fastMode 不变时永不刷新。）
 */
export function useZenModelOptionsReload(): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!isOpenAICompatApiMode() || !isZenFreeModelsFeatureEnabled()) {
      return
    }
    let alive = true
    void refreshZenFreeModelList().finally(() => {
      if (alive) {
        setTick(t => t + 1)
      }
    })
    return () => {
      alive = false
    }
  }, [])
  return tick
}
