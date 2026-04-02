/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lightweight stub for `@aws-sdk/client-bedrock-runtime`.
 * Keeps compile/bundle small while satisfying @anthropic-ai/bedrock-sdk and app imports.
 */

export type CountTokensCommandInput = Record<string, any>

class BedrockRuntimeServiceException extends Error {
  $fault?: string
  $metadata?: any
  constructor(options: any) {
    super(options?.message ?? options?.name ?? 'BedrockRuntimeServiceException')
    this.name = options?.name ?? 'BedrockRuntimeServiceException'
    this.$fault = options?.$fault
    this.$metadata = options?.$metadata
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class InternalServerException extends BedrockRuntimeServiceException {
  override name = 'InternalServerException'
  $fault = 'server' as const
  constructor(opts: any) {
    super({ name: 'InternalServerException', $fault: 'server', ...opts })
    Object.setPrototypeOf(this, InternalServerException.prototype)
  }
}

export class ThrottlingException extends BedrockRuntimeServiceException {
  override name = 'ThrottlingException'
  $fault = 'client' as const
  constructor(opts: any) {
    super({ name: 'ThrottlingException', $fault: 'client', ...opts })
    Object.setPrototypeOf(this, ThrottlingException.prototype)
  }
}

export class ValidationException extends BedrockRuntimeServiceException {
  override name = 'ValidationException'
  $fault = 'client' as const
  constructor(opts: any) {
    super({ name: 'ValidationException', $fault: 'client', ...opts })
    Object.setPrototypeOf(this, ValidationException.prototype)
  }
}

export class ModelStreamErrorException extends BedrockRuntimeServiceException {
  override name = 'ModelStreamErrorException'
  $fault = 'client' as const
  originalStatusCode?: number
  originalMessage?: string
  constructor(opts: any) {
    super({ name: 'ModelStreamErrorException', $fault: 'client', ...opts })
    Object.setPrototypeOf(this, ModelStreamErrorException.prototype)
    this.originalStatusCode = opts?.originalStatusCode
    this.originalMessage = opts?.originalMessage
  }
}

export class BedrockRuntimeClient {
  constructor(_config?: any) {}
  async send(_command: any): Promise<any> {
    return {}
  }
}

/** Minimal command shape for token counting stub path. */
export class CountTokensCommand {
  constructor(public readonly input: CountTokensCommandInput) {}
}
