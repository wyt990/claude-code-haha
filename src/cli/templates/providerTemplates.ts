/**
 * `--use-provider-template` 预置渠道（仅 baseUrl / models；密钥由用户另行配置）。
 */

export type ProviderTemplateId =
  | 'deepseek'
  | 'moonshot'
  | 'zhipu'
  | 'openrouter'
  | 'minimax'

export type ProviderTemplateDef = {
  baseUrl: string
  /** 空数组表示不限制 models（与 compat 语义一致） */
  models: string[]
}

export const PROVIDER_TEMPLATES: Record<ProviderTemplateId, ProviderTemplateDef> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  moonshot: {
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4', 'glm-4-flash', 'glm-3-turbo'],
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [],
  },
  minimax: {
    baseUrl: 'https://api.minimaxi.com/v1',
    models: ['MiniMax-M2.7-highspeed'],
  },
}

export function isProviderTemplateId(s: string): s is ProviderTemplateId {
  return s in PROVIDER_TEMPLATES
}
