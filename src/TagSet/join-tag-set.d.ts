import type { Readable } from "svelte/store";

export type TagSetMemberItem = {
  node: HTMLElement;
  label: string;
  value?: string | number;
  type?: string;
  size: string;
  disabled: boolean;
  filter: boolean;
};

export type TagSetMember = {
  /** The set's `size`. */
  size: Readable<"sm" | "default" | "lg" | undefined>;
  /** The set's `navigation`. */
  navigation: Readable<"tab" | "roving">;
  /** Whether the tag is collapsed into the "+N" indicator. */
  overflow: Readable<boolean>;
  /** Roving `tabindex`; `undefined` keeps the native tab order. */
  tabindex: Readable<0 | -1 | undefined>;
  /** Sync changed fields to the set. */
  update: (patch: Partial<TagSetMemberItem>) => void;
  /** Tell the set the tag's close button was clicked. */
  notifyClose: () => void;
};

/**
 * Join the parent `TagSet`, if any. Call during component init. Outside a
 * set, returns inert stores and no-op methods.
 */
export function joinTagSet(getItem: () => TagSetMemberItem): TagSetMember;
