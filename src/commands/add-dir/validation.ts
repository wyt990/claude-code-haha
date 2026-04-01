import chalk from 'chalk'
import { stat } from 'fs/promises'
import { dirname, resolve } from 'path'

/** NFS / 异常挂载上 stat 可能长时间不返回；超时后跳过以免启动卡死 */
const WORKSPACE_DIR_STAT_TIMEOUT_MS = 12_000

function statDirectoryWithTimeout(absolutePath: string) {
  return Promise.race([
    stat(absolutePath),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          Object.assign(new Error('Directory stat timed out'), {
            code: 'ETIMEDOUT' as const,
          }),
        )
      }, WORKSPACE_DIR_STAT_TIMEOUT_MS)
    }),
  ])
}
import type { ToolPermissionContext } from '../../Tool.js'
import { getErrnoCode } from '../../utils/errors.js'
import { expandPath } from '../../utils/path.js'
import {
  allWorkingDirectories,
  pathInWorkingPath,
} from '../../utils/permissions/filesystem.js'

export type AddDirectoryResult =
  | {
      resultType: 'success'
      absolutePath: string
    }
  | {
      resultType: 'emptyPath'
    }
  | {
      resultType: 'pathNotFound' | 'notADirectory'
      directoryPath: string
      absolutePath: string
    }
  | {
      resultType: 'statTimeout'
      directoryPath: string
      absolutePath: string
    }
  | {
      resultType: 'alreadyInWorkingDirectory'
      directoryPath: string
      workingDir: string
    }

export async function validateDirectoryForWorkspace(
  directoryPath: string,
  permissionContext: ToolPermissionContext,
): Promise<AddDirectoryResult> {
  if (!directoryPath) {
    return {
      resultType: 'emptyPath',
    }
  }

  // resolve() strips the trailing slash expandPath can leave on absolute
  // inputs, so /foo and /foo/ map to the same storage key (CC-33).
  const absolutePath = resolve(expandPath(directoryPath))

  // Check if path exists and is a directory (async + timeout so NFS hangs
  // cannot block startup indefinitely).
  try {
    const stats = await statDirectoryWithTimeout(absolutePath)
    if (!stats.isDirectory()) {
      return {
        resultType: 'notADirectory',
        directoryPath,
        absolutePath,
      }
    }
  } catch (e: unknown) {
    const code = getErrnoCode(e)
    if (code === 'ETIMEDOUT') {
      return {
        resultType: 'statTimeout',
        directoryPath,
        absolutePath,
      }
    }
    // Match prior existsSync() semantics: treat any of these as "not found"
    // rather than re-throwing. EACCES/EPERM in particular must not crash
    // startup when a settings-configured additional directory is inaccessible.
    if (
      code === 'ENOENT' ||
      code === 'ENOTDIR' ||
      code === 'EACCES' ||
      code === 'EPERM'
    ) {
      return {
        resultType: 'pathNotFound',
        directoryPath,
        absolutePath,
      }
    }
    throw e
  }

  // Get current permission context
  const currentWorkingDirs = allWorkingDirectories(permissionContext)

  // Check if already within an existing working directory
  for (const workingDir of currentWorkingDirs) {
    if (pathInWorkingPath(absolutePath, workingDir)) {
      return {
        resultType: 'alreadyInWorkingDirectory',
        directoryPath,
        workingDir,
      }
    }
  }

  return {
    resultType: 'success',
    absolutePath,
  }
}

export function addDirHelpMessage(result: AddDirectoryResult): string {
  switch (result.resultType) {
    case 'emptyPath':
      return 'Please provide a directory path.'
    case 'statTimeout':
      return `检查路径 ${chalk.bold(result.absolutePath)} 超时（常见于网络盘无响应）；已跳过该附加目录，请检查挂载或从设置中移除。`
    case 'pathNotFound':
      return `Path ${chalk.bold(result.absolutePath)} was not found.`
    case 'notADirectory': {
      const parentDir = dirname(result.absolutePath)
      return `${chalk.bold(result.directoryPath)} is not a directory. Did you mean to add the parent directory ${chalk.bold(parentDir)}?`
    }
    case 'alreadyInWorkingDirectory':
      return `${chalk.bold(result.directoryPath)} is already accessible within the existing working directory ${chalk.bold(result.workingDir)}.`
    case 'success':
      return `Added ${chalk.bold(result.absolutePath)} as a working directory.`
  }
}
