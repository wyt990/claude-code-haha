import React, {
  type PropsWithChildren,
  useContext,
  useLayoutEffect,
} from 'react';
import { writeSync } from 'fs';
import instances from '../instances.js';
import {
  DISABLE_MOUSE_TRACKING,
  ENABLE_MOUSE_TRACKING,
  ENTER_ALT_SCREEN,
  EXIT_ALT_SCREEN,
} from '../termio/dec.js';
import { TerminalWriteContext } from '../useTerminalNotification.js';
import Box from './Box.js';
import { TerminalSizeContext } from './TerminalSizeContext.js';

type Props = PropsWithChildren<{
  /** Enable SGR mouse tracking (wheel + click/drag). Default true. */
  mouseTracking?: boolean;
}>;

/**
 * Run children in the terminal's alternate screen buffer (DEC ?1049).
 * useLayoutEffect 与首帧 commit 对齐，避免备用屏序列过晚。
 */
export function AlternateScreen({
  children,
  mouseTracking = true,
}: Props): React.ReactNode {
  const size = useContext(TerminalSizeContext);
  const writeRaw = useContext(TerminalWriteContext);

  useLayoutEffect(() => {
    const ink = instances.get(process.stdout);
    if (!writeRaw) {
      try {
        writeSync(
          2,
          'Claude Code〔AlternateScreen〕TerminalWriteContext 为空，无法写 ?1049h\n',
        );
      } catch {
        /* ignore */
      }
      return;
    }
    writeRaw(
      ENTER_ALT_SCREEN +
        '\x1b[2J\x1b[H' +
        (mouseTracking ? ENABLE_MOUSE_TRACKING : ''),
    );
    ink?.setAltScreenActive(true, mouseTracking);
    return () => {
      ink?.setAltScreenActive(false);
      ink?.clearTextSelection();
      writeRaw(
        (mouseTracking ? DISABLE_MOUSE_TRACKING : '') + EXIT_ALT_SCREEN,
      );
    };
  }, [writeRaw, mouseTracking]);

  const rows = size?.rows ?? 24;
  return (
    <Box
      flexDirection="column"
      height={rows}
      width="100%"
      flexShrink={0}
    >
      {children}
    </Box>
  );
}
