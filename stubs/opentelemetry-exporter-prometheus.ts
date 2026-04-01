import { ExportResultCode, type ExportResult } from '@opentelemetry/core'
import type { PushMetricExporter, ResourceMetrics } from '@opentelemetry/sdk-metrics'

export class PrometheusExporter implements PushMetricExporter {
  constructor(_opts?: unknown) {}

  export(
    _metrics: ResourceMetrics,
    resultCallback: (result: ExportResult) => void,
  ): void {
    resultCallback({ code: ExportResultCode.SUCCESS })
  }

  forceFlush(): Promise<void> {
    return Promise.resolve()
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}
