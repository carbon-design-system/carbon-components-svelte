import type { ComponentType } from "svelte";

/** How a host updates the collection in place. */
export type Mode = "legacy" | "runes";

export type CollectionCase = {
  /** Component name, as exported from the package. */
  name: string;
  component: ComponentType;
  /** The array prop the host mutates in place. */
  prop: string;
  /** Other props every render of this case starts from. */
  props?: Record<string, unknown>;
  /** Contents the host renders with. Called once per render. */
  initial: () => unknown[];
  /** Contents the host splices into the same array. Called once per render. */
  replacement: () => unknown[];
  /**
   * Runs after the replacement. Use the component once (open it, select,
   * sort) and assert it shows the replacement, since a stale lookup often
   * surfaces only on the next interaction. `instance` is the component, for
   * cases whose interaction is a method such as `showNode`.
   */
  check: (instance: unknown) => void | Promise<void>;
  /** A known bug per mode, with the issue or PR that tracks it. */
  fails?: Partial<Record<Mode, string>>;
};

/** Components and props the contract skips, with the reason. Keyed `Component.prop`. */
export type Exemptions = Record<string, string>;

export const key = (c: Pick<CollectionCase, "name" | "prop">) =>
  `${c.name}.${c.prop}`;
