import * as React from 'react';
import { useMemo } from 'react';
import {
  type Command,
  type CommandBase,
  type CommandResultDisplay,
  getCommandName,
  type PromptCommand,
} from '../../commands.js';
import { Box, Text } from '../../ink.js';
import {
  estimateSkillFrontmatterTokens,
  getSkillsPath,
} from '../../skills/loadSkillsDir.js';
import { getDisplayPath } from '../../utils/file.js';
import { formatTokens } from '../../utils/format.js';
import { type SettingSource } from '../../utils/settings/constants.js';
import { plural } from '../../utils/stringUtils.js';
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
import { Dialog } from '../design-system/Dialog.js';

type SkillCommand = CommandBase & PromptCommand;
type SkillSource = SettingSource | 'plugin' | 'mcp';
type Props = {
  onExit: (
    result?: string,
    options?: { display?: CommandResultDisplay },
  ) => void;
  commands: Command[];
};

function getSourceTitle(source: SkillSource): string {
  if (source === 'plugin') {
    return '插件 Skill';
  }
  if (source === 'mcp') {
    return 'MCP Skill';
  }
  switch (source) {
    case 'userSettings':
      return '用户 Skill';
    case 'projectSettings':
      return '项目 Skill';
    case 'localSettings':
      return '本地 Skill（.gitignore）';
    case 'flagSettings':
      return 'CLI 参数 Skill';
    case 'policySettings':
      return '托管策略 Skill';
  }
}

function getSourceSubtitle(
  source: SkillSource,
  skills: SkillCommand[],
): string | undefined {
  if (source === 'mcp') {
    const servers = [
      ...new Set(
        skills
          .map(s => {
            const idx = s.name.indexOf(':');
            return idx > 0 ? s.name.slice(0, idx) : null;
          })
          .filter((n): n is string => n != null),
      ),
    ];
    return servers.length > 0 ? servers.join(', ') : undefined;
  }
  const skillsPath = getDisplayPath(getSkillsPath(source, 'skills'));
  const hasCommandsSkills = skills.some(
    s => s.loadedFrom === 'commands_DEPRECATED',
  );
  return hasCommandsSkills
    ? `${skillsPath}, ${getDisplayPath(getSkillsPath(source, 'commands'))}`
    : skillsPath;
}

export function SkillsMenu({ onExit, commands }: Props): React.ReactNode {
  const skills = useMemo(() => {
    return commands.filter(
      (cmd): cmd is SkillCommand =>
        cmd.type === 'prompt' &&
        (cmd.loadedFrom === 'skills' ||
          cmd.loadedFrom === 'commands_DEPRECATED' ||
          cmd.loadedFrom === 'plugin' ||
          cmd.loadedFrom === 'mcp'),
    );
  }, [commands]);

  const skillsBySource = useMemo((): Record<SkillSource, SkillCommand[]> => {
    const groups: Record<SkillSource, SkillCommand[]> = {
      policySettings: [],
      userSettings: [],
      projectSettings: [],
      localSettings: [],
      flagSettings: [],
      plugin: [],
      mcp: [],
    };

    for (const skill of skills) {
      const source = skill.source as SkillSource;
      if (source in groups) {
        groups[source].push(skill);
      }
    }

    for (const group of Object.values(groups)) {
      group.sort((a, b) =>
        getCommandName(a).localeCompare(getCommandName(b)),
      );
    }

    return groups;
  }, [skills]);

  const handleCancel = (): void => {
    onExit('已关闭 Skill 列表', { display: 'system' });
  };

  if (skills.length === 0) {
    return (
      <Dialog
        title="Skill"
        subtitle="未找到 Skill"
        onCancel={handleCancel}
        hideInputGuide
      >
        <Text dimColor>
          可在 .claude/skills/ 或 ~/.claude/skills/ 中创建 Skill
        </Text>
        <Text dimColor italic>
          <ConfigurableShortcutHint
            action="confirm:no"
            context="Confirmation"
            fallback="Esc"
            description="关闭"
          />
        </Text>
      </Dialog>
    );
  }

  const renderSkill = (skill: SkillCommand) => {
    const estimatedTokens = estimateSkillFrontmatterTokens(skill);
    const tokenDisplay = `~${formatTokens(estimatedTokens)}`;
    const pluginName =
      skill.source === 'plugin'
        ? skill.pluginInfo?.pluginManifest.name
        : undefined;

    return (
      <Box key={`${skill.name}-${skill.source}`}>
        <Text>{getCommandName(skill)}</Text>
        <Text dimColor>
          {pluginName ? ` · ${pluginName}` : ''} · {tokenDisplay} 描述 token
        </Text>
      </Box>
    );
  };

  const renderSkillGroup = (source: SkillSource) => {
    const groupSkills = skillsBySource[source];
    if (groupSkills.length === 0) {
      return null;
    }

    const title = getSourceTitle(source);
    const subtitle = getSourceSubtitle(source, groupSkills);

    return (
      <Box flexDirection="column" key={source}>
        <Box>
          <Text bold dimColor>
            {title}
          </Text>
          {subtitle && <Text dimColor> ({subtitle})</Text>}
        </Box>
        {groupSkills.map(skill => renderSkill(skill))}
      </Box>
    );
  };

  return (
    <Dialog
      title="Skill"
      subtitle={`${skills.length} ${plural(skills.length, '项 Skill', '项 Skill')}`}
      onCancel={handleCancel}
      hideInputGuide
    >
      <Box flexDirection="column" gap={1}>
        {renderSkillGroup('projectSettings')}
        {renderSkillGroup('userSettings')}
        {renderSkillGroup('policySettings')}
        {renderSkillGroup('plugin')}
        {renderSkillGroup('mcp')}
      </Box>
      <Text dimColor italic>
        <ConfigurableShortcutHint
          action="confirm:no"
          context="Confirmation"
          fallback="Esc"
          description="关闭"
        />
      </Text>
    </Dialog>
  );
}
