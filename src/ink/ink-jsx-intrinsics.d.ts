/**
 * Ink host elements — merged into `React.JSX.IntrinsicElements` (react-jsx).
 */
import 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ink-box': Record<string, unknown>
      'ink-text': Record<string, unknown>
      'ink-link': Record<string, unknown>
      'ink-raw-ansi': Record<string, unknown>
    }
  }
}
