import { logForDebugging } from './debug.js'

/**
 * Ant 内部构建：检测主线程长时间阻塞。外部构建为 no-op。
 */
export function startEventLoopStallDetector(): void {
  logForDebugging('[eventLoopStallDetector] stub — not active in this build')
}
