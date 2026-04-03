/* eslint-disable @typescript-eslint/no-explicit-any */

export function ls(_cachePath: string): Promise<any[]> {
  return Promise.resolve([])
}

export namespace ls {
  export function stream(_cachePath: string): any {
    return {
      on(_event: string, _cb: (...args: any[]) => void) {
        return this
      },
    }
  }
}

export namespace rm {
  export function entry(_cachePath: string, _key: string): Promise<void> {
    return Promise.resolve()
  }
}
