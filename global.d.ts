/** Injected by `preload.ts` at runtime. */
declare const MACRO: {
  VERSION: string
  PACKAGE_URL: string
  NATIVE_PACKAGE_URL: string
  BUILD_TIME: string
  FEEDBACK_CHANNEL: string
  VERSION_CHANGELOG: string
  ISSUES_EXPLAINER: string
  /** Internal Anthropic build; always false in open-source preload. */
  BUILD_IS_ANT: boolean
}
