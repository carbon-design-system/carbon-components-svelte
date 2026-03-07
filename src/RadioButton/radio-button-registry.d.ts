import type { Writable } from "svelte/store";

type InstanceKey = Record<string, never>;

type RadioGroup = {
  selectedKey: Writable<InstanceKey | undefined>;
  members: Set<InstanceKey>;
};

type RegisterResult = {
  selectedKey: Writable<InstanceKey | undefined>;
  unregister: () => void;
};

export function registerRadioButton(
  name: string,
  key: InstanceKey,
  checked: boolean,
): RegisterResult;

export function updateGroupSelection(name: string, key: InstanceKey): void;

export function getGroup(name: string): RadioGroup | undefined;

export function clearAllGroups(): void;
