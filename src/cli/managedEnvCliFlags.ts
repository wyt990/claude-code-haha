/** 仅用于 `cli.tsx` 判断是否走安装前缀 `.env` 维护 fast-path（零重型依赖）。 */

const MANAGED_ENV_FLAGS = new Set([
  '--env-list',
  '--env-set',
  '--env-unset',
  '--env-export',
  '--env-import',
  '--set-default-model',
  '--enable-openai-compat',
  '--disable-openai-compat',
  '--set-openai-base-url',
  '--set-extra-body',
  '--add-provider',
  '--remove-provider',
  '--list-providers',
  '--update-provider',
  '--add-model-to-provider',
  '--remove-model-from-provider',
  '--enable-zen-models',
  '--disable-zen-models',
  '--list-zen-models',
  '--use-provider-template',
])

export function shouldHandleManagedEnvCli(argv: string[]): boolean {
  return argv.some(a => MANAGED_ENV_FLAGS.has(a))
}

export function isManagedEnvSubcommand(cmd: string): boolean {
  return MANAGED_ENV_FLAGS.has(cmd)
}
