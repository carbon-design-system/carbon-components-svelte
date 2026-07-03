export type CommandShortcutFields = {
  shortcut?: ReadonlyArray<string>;
  shortcutKeys?: string | ReadonlyArray<string>;
};

export function parseDisplayShortcut(segments: ReadonlyArray<string>): string[];

export function getCommandCombos(command: CommandShortcutFields): string[];

export function buildCommandShortcutMap<T>(
  commands: ReadonlyArray<T>,
  options?: { getCombos?: (command: T) => string[] },
): Map<string, T>;
