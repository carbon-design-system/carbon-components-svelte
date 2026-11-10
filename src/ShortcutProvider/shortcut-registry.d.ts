import type { Readable } from "svelte/store";

/** A shortcut to register: its keys, what it does, and what runs. */
export type ShortcutSpec = {
  /**
   * The keys, such as `"mod+k"` or `"shift+?"`. `mod` is Command on Apple
   * platforms and Control elsewhere.
   */
  keys: string;
  /** What the shortcut does, in the words of the help sheet. */
  label: string;
  /** Called when the shortcut is pressed. */
  onTrigger: (event: KeyboardEvent) => void;
};

export type ShortcutEntry = {
  keys: string;
  label: string;
  scope: ShortcutScope;
  /** The element the shortcut belongs to, if registered by `use:shortcut`. */
  node: HTMLElement | null;
  /** Whether the shortcut is a typed character, left to text fields. */
  typed: boolean;
  onTrigger: (event: KeyboardEvent) => void;
};

export type ShortcutRoot = {
  scopes: ShortcutScope[];
  /** Every registered entry, in every scope, updated once per microtask. */
  entries: Readable<ShortcutEntry[]>;
  notify: () => void;
  /** Listen for `keydown` on `window`. Returns a function that stops. */
  start: () => () => void;
};

export type ShortcutScope = {
  id: string;
  /** The heading of the scope in the help sheet. */
  name: string | undefined;
  root: ShortcutRoot;
  depth: number;
  /** The `ShortcutProvider` element, once mounted. */
  element: HTMLElement | null;
  entries: ShortcutEntry[];
  register: (
    spec: ShortcutSpec,
    node?: HTMLElement | null,
  ) => {
    update: (spec: ShortcutSpec) => void;
    destroy: () => void;
  };
  rekey: (id: string) => void;
  destroy: () => void;
};

export type ShortcutGroup = {
  scope: string | undefined;
  entries: ShortcutEntry[];
};

export function createShortcutScope(options: {
  id: string;
  name?: string;
  parent?: ShortcutScope | null;
}): ShortcutScope;

export function findShortcutScope(node: Element): ShortcutScope | undefined;

export function activeShortcutGroups(
  root: ShortcutRoot,
  list: ReadonlyArray<ShortcutEntry>,
  except?: Element | null,
): ShortcutGroup[];
