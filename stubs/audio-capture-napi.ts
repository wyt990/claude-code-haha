export type AudioDataCallback = (data: Buffer) => void
export type AudioErrorCallback = () => void

export function isNativeAudioAvailable(): boolean {
  return false
}

export function isNativeRecordingActive(): boolean {
  return false
}

export function stopNativeRecording(): void {}
export function startNativeRecording(_onData: AudioDataCallback, _onError: AudioErrorCallback): boolean {
  return false
}

export function createCapture(_opts: unknown): unknown {
  return null
}
