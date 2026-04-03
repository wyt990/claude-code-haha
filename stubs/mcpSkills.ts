/* eslint-disable @typescript-eslint/no-explicit-any */
const _skillsCache: Map<any, any> = new Map()

export function fetchMcpSkillsForClient(_client: any): Promise<any[]> {
  return Promise.resolve([])
}
fetchMcpSkillsForClient.cache = _skillsCache
