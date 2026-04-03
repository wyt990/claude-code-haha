// Local recovery stub for missing filePersistence types

export const DEFAULT_UPLOAD_CONCURRENCY = 5
export const FILE_COUNT_LIMIT = 100
export const OUTPUTS_SUBDIR = 'outputs'

export interface FailedPersistence {
  filePath?: string
  filename?: string // Can use either filePath or filename
  error: string
}

export interface PersistedFile {
  filePath?: string
  filename?: string // Can use either filePath or filename
  fileId?: string
  file_id?: string // Snake_case alias
}

export interface FilesPersistedEventData {
  persisted?: PersistedFile[]
  failed?: FailedPersistence[]
  files?: PersistedFile[] // Alias for persisted
}

export type TurnStartTime = number
