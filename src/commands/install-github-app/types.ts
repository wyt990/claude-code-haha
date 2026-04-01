export type Workflow = string

export type Warning = {
  title: string
  message: string
  instructions: string[]
}

/** Wizard state — permissive record; fields are set across many steps. */
export type State = Record<string, any>
