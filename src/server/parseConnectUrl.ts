export type ParsedConnectUrl = {
  serverUrl: string
  authToken?: string
}

/**
 * 解析 `cc://` / `cc+unix://` CLI 连接 URL，供 DIRECT_CONNECT 与 `claude open` 使用。
 */
export function parseConnectUrl(ccUrl: string): ParsedConnectUrl {
  if (ccUrl.startsWith('cc+unix://')) {
    const rest = ccUrl.slice('cc+unix://'.length)
    const q = rest.indexOf('?')
    const pathPart = q === -1 ? rest : rest.slice(0, q)
    const query = q === -1 ? '' : rest.slice(q + 1)
    const authToken =
      new URLSearchParams(query).get('token') ??
      new URLSearchParams(query).get('auth') ??
      undefined
    const socketPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`
    return {
      serverUrl: `unix:${decodeURIComponent(socketPath)}`,
      authToken: authToken ?? undefined,
    }
  }

  const normalized = ccUrl.replace(/^cc:\/\//i, 'http://')
  let u: URL
  try {
    u = new URL(normalized)
  } catch {
    throw new Error(`Invalid Claude Code connect URL: ${ccUrl}`)
  }

  const fromQuery =
    u.searchParams.get('token') ?? u.searchParams.get('auth') ?? undefined
  let authToken = fromQuery
  if (!authToken && u.username) {
    authToken = u.password
      ? `${decodeURIComponent(u.username)}:${decodeURIComponent(u.password)}`
      : decodeURIComponent(u.username)
  }

  u.username = ''
  u.password = ''

  const serverUrl = `${u.protocol}//${u.host}`
  return { serverUrl, authToken: authToken || undefined }
}
