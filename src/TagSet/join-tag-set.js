// @ts-check
import { getContext, onMount } from "svelte";
import { derived, readable } from "svelte/store";
import { noop } from "../utils/noop.js";
import { uniqueId } from "../utils/unique-id.js";

/**
 * What a tag registers with its `TagSet`, minus the id the set assigns.
 * @typedef {Object} TagSetMemberItem
 * @property {HTMLElement} node
 * @property {string} label
 * @property {string | number} [value]
 * @property {string} [type]
 * @property {string} size
 * @property {boolean} disabled
 * @property {boolean} filter
 */

/**
 * The parts of the `carbon:TagSet` context a member uses.
 * @typedef {Object} TagSetContext
 * @property {import("svelte/store").Readable<"xs" | "sm" | "default" | "lg" | undefined>} size
 * @property {import("svelte/store").Readable<"tab" | "roving">} navigation
 * @property {import("svelte/store").Readable<Set<string>>} overflowIds
 * @property {import("svelte/store").Readable<string | null>} tabStopId
 * @property {(item: TagSetMemberItem & { id: string }) => void} register
 * @property {(id: string) => void} unregister
 * @property {(id: string, patch: Partial<TagSetMemberItem>) => void} update
 * @property {(id: string) => void} notifyClose
 */

/**
 * @typedef {Object} TagSetMember
 * @property {import("svelte/store").Readable<"xs" | "sm" | "default" | "lg" | undefined>} size - The set's `size`.
 * @property {import("svelte/store").Readable<"tab" | "roving">} navigation - The set's `navigation`.
 * @property {import("svelte/store").Readable<boolean>} overflow - Whether the tag is collapsed into the "+N" indicator.
 * @property {import("svelte/store").Readable<"0" | "-1" | undefined>} tabindex - Roving `tabindex`; `undefined` keeps the native tab order.
 * @property {(patch: Partial<TagSetMemberItem>) => void} update - Sync changed fields to the set.
 * @property {() => void} notifyClose - Tell the set the tag's close button was clicked.
 */

/** @type {TagSetMember} */
const standalone = {
  size: readable(undefined),
  navigation: readable("tab"),
  overflow: readable(false),
  tabindex: readable(undefined),
  update: noop,
  notifyClose: noop,
};

/**
 * Join the parent `TagSet`, if any, so it can measure the tag, collapse it
 * into its "+N" indicator, and include it in roving focus. Call during
 * component init. Outside a set, returns inert stores and no-op methods.
 *
 * @param {() => TagSetMemberItem} getItem - Read on mount to register the tag.
 * @returns {TagSetMember}
 */
export function joinTagSet(getItem) {
  /** @type {TagSetContext | undefined} */
  const tagSet = getContext("carbon:TagSet");
  if (!tagSet) return standalone;

  const id = uniqueId("ctag");

  onMount(() => {
    tagSet.register({ id, ...getItem() });
    return () => tagSet.unregister(id);
  });

  return {
    size: tagSet.size,
    navigation: tagSet.navigation,
    overflow: derived(tagSet.overflowIds, (ids) => ids.has(id)),
    // A roving set owns the tab order: only its current tab stop is
    // tabbable. `undefined` until the set picks one, so server-rendered tags
    // keep their native order.
    tabindex: derived(
      [tagSet.navigation, tagSet.tabStopId],
      ([navigation, tabStopId]) =>
        navigation === "roving" && tabStopId !== null
          ? tabStopId === id
            ? "0"
            : "-1"
          : undefined,
    ),
    update: (patch) => tagSet.update(id, patch),
    notifyClose: () => tagSet.notifyClose(id),
  };
}
