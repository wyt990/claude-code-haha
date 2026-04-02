/**
 * Internal (ant) builds ship a real implementation. OSS / compile bundles need
 * this module so the resolver succeeds; runtime still only loads logic when
 * USER_TYPE === 'ant' in envUtils.
 */
export function checkProtectedNamespace(): boolean {
  return false
}
