import './src/bootstrap/installPrefixEnv.js';
import { CLAUDE_CODE_VERSION } from './src/constants/version.js';
import { applyAnthropicBaseUrlEnvNormalization } from './src/utils/anthropicBaseUrl.js';

applyAnthropicBaseUrlEnvNormalization();

const version = process.env.CLAUDE_CODE_LOCAL_VERSION ?? CLAUDE_CODE_VERSION;
const packageUrl = process.env.CLAUDE_CODE_LOCAL_PACKAGE_URL ?? 'claude-code-local';
const buildTime = process.env.CLAUDE_CODE_LOCAL_BUILD_TIME ?? new Date().toISOString();

process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= '1';

Object.assign(globalThis, {
  MACRO: {
    VERSION: version,
    PACKAGE_URL: packageUrl,
    NATIVE_PACKAGE_URL: packageUrl,
    BUILD_TIME: buildTime,
    FEEDBACK_CHANNEL: 'local',
    VERSION_CHANGELOG: '',
    ISSUES_EXPLAINER: '',
    /** Set true only in internal builds that patch preload. */
    BUILD_IS_ANT: false as boolean,
  },
});

// OpenCode Zen 免费模型列表：尽早后台拉取（仅内存，不写 .env）；与 main 中预取互为补充。
void import('./src/services/api/openaiCompat/zenFreeModels.js').then(m => {
  void m.refreshZenFreeModelList()
})
