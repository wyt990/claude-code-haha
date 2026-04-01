import { ExportResultCode, type ExportResult } from '@opentelemetry/core'
import type { LogRecordExporter, ReadableLogRecord } from '@opentelemetry/sdk-logs'

export class OTLPLogExporter implements LogRecordExporter {
  constructor(_opts?: unknown) {}

  export(
    _logs: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    resultCallback({ code: ExportResultCode.SUCCESS })
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}
