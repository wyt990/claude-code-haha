/** Markdown bundled as string (Bun / bundler text loader). */
declare module '*.md' {
  const content: string
  export default content
}
