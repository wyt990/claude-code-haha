/**
 * 将 KeyboardShortcutHint 的英文 action 文案转为中文（终端底部快捷键提示等）。
 * 未收录的 action 原样返回，便于渐进补全。
 */
const ACTION_ZH: Record<string, string> = {
  interrupt: '中断',
  cancel: '取消',
  confirm: '确认',
  select: '选择',
  navigate: '移动',
  nav: '移动',
  toggle: '切换',
  expand: '展开',
  switch: '切换',
  complete: '补全',
  add: '添加',
  save: '保存',
  submit: '提交',
  continue: '继续',
  resume: '继续',
  search: '搜索',
  skip: '跳过',
  unset: '清除',
  copy: '复制',
  close: '关闭',
  stop: '停止',
  'stop agents': '停止子代理',
  'stop all agents': '停止全部子代理',
  'go back': '返回',
  foreground: '切到前台',
  view: '查看',
  manage: '管理',
  return: '返回',
  tabs: '标签页',
  cycle: '循环切换',
  teleport: '传送',
  'show tasks': '显示任务',
  'show teammates': '显示队友',
  hide: '隐藏',
  'hide tasks': '隐藏任务',
  'return to team lead': '返回主对话',
  'run in background': '后台运行',
  'edit in your editor': '在编辑器中修改',
  'enter text': '输入文字',
  'native select': '系统框选',
  'view tasks': '查看任务',
  'disable external includes': '关闭外部 include',
}

export function translateKeyboardHintAction(action: string): string {
  return ACTION_ZH[action] ?? action
}
