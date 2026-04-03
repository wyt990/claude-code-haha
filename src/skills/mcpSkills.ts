/* eslint-disable @typescript-eslint/no-explicit-any */

async function fetchMcpSkillsForClientImpl(_client: any): Promise<any[]> {
  return []
}

export const fetchMcpSkillsForClient = Object.assign(
  fetchMcpSkillsForClientImpl,
  {
    cache: {
      clear: () => {},
      delete: (_key: string) => false as boolean,
      size: () => 0,
      get: (_key: string) => undefined as undefined,
      has: (_key: string) => false as boolean,
    },
  },
)
