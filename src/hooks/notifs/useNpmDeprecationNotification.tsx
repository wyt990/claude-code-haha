import { isInBundledMode } from 'src/utils/bundledMode.js';
import { getCurrentInstallationType } from 'src/utils/doctorDiagnostic.js';
import { isEnvTruthy } from 'src/utils/envUtils.js';
import { useStartupNotification } from './useStartupNotification.js';
const NPM_DEPRECATION_MESSAGE = 'Claude Code has switched from npm to native installer. Run `claude install` or see https://docs.anthropic.com/en/docs/claude-code/getting-started for more options.';

/** preload.ts 为本仓库设置 FEEDBACK_CHANNEL=local，与官方安装器无关，不展示 npm 迁移提示 */
function isLocalSourceFork(): boolean {
  const macro = (globalThis as { MACRO?: { FEEDBACK_CHANNEL?: string } }).MACRO;
  return macro?.FEEDBACK_CHANNEL === 'local';
}

export function useNpmDeprecationNotification() {
  useStartupNotification(_temp);
}
async function _temp() {
  if (
    isInBundledMode() ||
    isEnvTruthy(process.env.DISABLE_INSTALLATION_CHECKS) ||
    isLocalSourceFork()
  ) {
    return null;
  }
  const installationType = await getCurrentInstallationType();
  if (installationType === "development") {
    return null;
  }
  return {
    timeoutMs: 15000,
    key: "npm-deprecation-warning",
    text: NPM_DEPRECATION_MESSAGE,
    color: "warning",
    priority: "high"
  };
}