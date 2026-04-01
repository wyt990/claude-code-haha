import React from 'react';
import type { StatsStore } from './context/stats.js';
import type { Root } from './ink.js';
import type { Props as REPLProps } from './screens/REPL.js';
import type { AppState } from './state/AppStateStore.js';
import type { FpsMetrics } from './utils/fpsTracker.js';
import { AlternateScreen } from './ink/components/AlternateScreen.js';
import { isFullscreenEnvEnabled, isMouseTrackingEnabled } from './utils/fullscreen.js';
import {
  emitTerminalTuiLayoutDiagnostics,
  startupProgressStderr,
} from './utils/startupProgressStderr.js';

type AppWrapperProps = {
  getFpsMetrics: () => FpsMetrics | undefined;
  stats?: StatsStore;
  initialState: AppState;
};

export async function launchRepl(
  root: Root,
  appProps: AppWrapperProps,
  replProps: REPLProps,
  renderAndRun: (root: Root, element: React.ReactNode) => Promise<void>,
): Promise<void> {
  emitTerminalTuiLayoutDiagnostics();
  startupProgressStderr('launchRepl：开始动态 import(App) 与 import(REPL)…');
  const { App } = await import('./components/App.js');
  startupProgressStderr('launchRepl：App 已加载，继续加载 REPL…');
  const { REPL } = await import('./screens/REPL.js');
  const replCore = <REPL {...replProps} />;
  const fullscreen = isFullscreenEnvEnabled();
  const replTree = fullscreen ? (
    <AlternateScreen mouseTracking={isMouseTrackingEnabled()}>{replCore}</AlternateScreen>
  ) : (
    replCore
  );
  startupProgressStderr(
    `launchRepl：REPL 已加载；全屏=${String(fullscreen)}${fullscreen ? '，已由 launchRepl 用 <AlternateScreen> 包裹 REPL（外层进入 ?1049）' : ''}`,
  );
  await renderAndRun(root, <App {...appProps}>{replTree}</App>);
}
