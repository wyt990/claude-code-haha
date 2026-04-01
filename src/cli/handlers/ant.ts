/** ANT-only CLI handlers (stub for local fork). */
export async function logHandler(_logId: string | number | undefined): Promise<void> {}

export async function errorHandler(_n: number | undefined): Promise<void> {}

export async function exportHandler(
  _source: string,
  _outputFile: string,
): Promise<void> {}

export async function taskCreateHandler(
  _subject: string,
  _opts: { description?: string; list?: string },
): Promise<void> {}

export async function taskListHandler(_opts: {
  list?: string
  pending?: boolean
  json?: boolean
}): Promise<void> {}

export async function taskGetHandler(
  _id: string,
  _opts: { list?: string },
): Promise<void> {}

export async function taskUpdateHandler(
  _id: string,
  _opts: Record<string, unknown>,
): Promise<void> {}

export async function taskDirHandler(_opts: { list?: string }): Promise<void> {}

export async function completionHandler(
  _shell: string,
  _opts: { output?: string },
  _program: unknown,
): Promise<void> {}
