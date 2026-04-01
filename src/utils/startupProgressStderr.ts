import { writeSync } from 'fs';
import { isEnvTruthy } from './envUtils.js';

/**
 * stderr 为 TTY 且 CLAUDE_CODE_STARTUP_PROGRESS=1。
 * 不与 CLAUDE_CODE_SKIP_STARTUP_DIALOGS 绑定，避免跳过对话框时刷屏干扰全屏 TUI（stderr 常与主界面同一视窗叠显）。
 */
export function shouldEmitStartupProgressToStderr(): boolean {
  if (!process.stderr.isTTY) {
    return false;
  }
  return isEnvTruthy(process.env.CLAUDE_CODE_STARTUP_PROGRESS);
}

/** 罕见 reconciler 错误：不受 STARTUP_PROGRESS 限制，便于定位白屏（体量小）。 */
export function shouldLogInkReconcilerErrorsToStderr(): boolean {
  return process.stderr.isTTY === true;
}

export function startupProgressStderr(msg: string): void {
  if (!shouldEmitStartupProgressToStderr()) {
    return;
  }
  try {
    writeSync(2, `Claude Code〔启动〕${msg}\n`);
  } catch {
    /* ignore */
  }
}

/**
 * 说明「备用屏幕」含义，并打印当前是否会进入 DEC 1049（与物理显示器数量无关）。
 */
export function emitTerminalTuiLayoutDiagnostics(): void {
  if (!shouldEmitStartupProgressToStderr()) {
    return;
  }
  /* eslint-disable @typescript-eslint/no-require-imports -- 延迟加载 fullscreen，避免与 Ink/REPL 初始化形成环导致 AlternateScreen 内日志静默失败 */
  const {
    isFullscreenEnvEnabled,
    isTmuxControlMode,
  } = require('./fullscreen.js') as typeof import('./fullscreen.js');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const cols = process.stdout.columns ?? 0;
  const rows = process.stdout.rows ?? 0;
  const fullscreen = isFullscreenEnvEnabled();
  const tmuxCc = isTmuxControlMode();
  const userType = process.env.USER_TYPE ?? '(未设置)';
  const noFlicker = process.env.CLAUDE_CODE_NO_FLICKER ?? '(未设置)';
  startupProgressStderr(
    '终端概念：仍是一个终端窗口；「备用屏幕」指同一窗口内的第二套屏幕缓冲（DEC CSI ?1049h/l），不是第二块物理屏。',
  );
  startupProgressStderr(
    `当前缓冲检测：stdout isTTY=${String(process.stdout.isTTY)} cols=${cols} rows=${rows}；stderr isTTY=${String(process.stderr.isTTY)}`,
  );
  startupProgressStderr(
    `全屏 REPL 开关 isFullscreenEnvEnabled=${fullscreen}（为 true 时由 src/replLauncher.tsx 用 <AlternateScreen> 包裹 REPL，向 stdout 发送 ?1049h）`,
  );
  startupProgressStderr(
    `影响因素：USER_TYPE=${userType}（external 构建下默认非全屏，除非 CLAUDE_CODE_NO_FLICKER=1）；isTmuxControlMode=${tmuxCc}；CLAUDE_CODE_NO_FLICKER=${noFlicker}`,
  );
  startupProgressStderr(
    '其它会临时进入备用屏的代码：Ink.enterAlternateScreen / exitAlternateScreen（src/ink/ink.tsx，外部编辑器、终端面板、thinkback 等）',
  );
  if (!fullscreen) {
    startupProgressStderr(
      '提示：external 构建默认不走全屏 REPL；若希望主界面也进入备用缓冲（与官方 ant 行为接近），可设 CLAUDE_CODE_NO_FLICKER=1（见 src/utils/fullscreen.ts 中 isFullscreenEnvEnabled）',
    );
  }
}
