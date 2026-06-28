<script>
  /**
   * Render a row of `UserAvatar` children. The group adds the "+N" overflow chip.
   * @restProps {div}
   */

  /**
   * Specify the maximum number of avatars to show before collapsing the rest
   * into a "+N" overflow avatar. Set to `0` to show every avatar.
   * @type {number}
   */
  export let max = 5;

  /**
   * Specify the total number of people represented. Defaults to the number of
   * slotted avatars. Set this when you render only a subset (large groups) so
   * the overflow count stays right without mounting every avatar.
   * @type {number}
   */
  export let total = undefined;

  /**
   * Specify the spacing between avatars. Leave unset for the default
   * overlapping (stacked) layout. A positive value spaces the avatars apart,
   * accepting a Carbon layout scale (`0`–`13`) or a CSS length string. A
   * negative length string (for example `"-1rem"`) overlaps them by that
   * amount.
   * @type {import("../Stack/Stack.svelte").StackScale | string}
   */
  export let gap = undefined;

  /**
   * Specify the size of the avatars. Applies to slotted avatars without their
   * own `size`, and to the "+N" overflow chip.
   * @type {"sm" | "md" | "lg" | "xl"}
   */
  export let size = "md";

  /**
   * Specify the tooltip text for the "+N" overflow avatar. Defaults to a
   * comma-separated list of hidden slotted `name` values. Set this when using
   * `total` for people who are not mounted.
   * @type {string}
   */
  export let overflowTooltipText = undefined;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import Stack from "../Stack/Stack.svelte";
  import UserAvatarGroupOverflow from "./UserAvatarGroupOverflow.svelte";

  /** @type {import("svelte/store").Writable<Array<{ id: string; name: string; node?: HTMLElement }>>} */
  const items = writable([]);
  const maxStore = writable(0);
  const sizeStore = writable(size);
  // Tracks which avatar's tooltip is open so only one shows at a time. Scoped
  // per group instance.
  /** @type {import("svelte/store").Writable<string | null>} */
  const activeTooltip = writable(null);

  function isNegativeGap(value) {
    return typeof value === "string" && value.trim().startsWith("-");
  }

  // `max` of 0 (or non-positive) means "no limit"; mirror that as 0 in the
  // store so registered avatars never mark themselves as overflow.
  $: hasLimit = Number.isFinite(max) && max > 0;
  $: maxStore.set(hasLimit ? max : 0);
  $: sizeStore.set(size);

  // Avatars register in mount order, which differs from DOM order when they are
  // conditionally rendered. Each registers from its own `onMount`, so its node
  // is already in the DOM; sort the registry by document position right then to
  // keep the visible avatars and overflow names tracking the rendered layout.
  // This stays synchronous (no `afterUpdate`) so the order is correct in the
  // same flush, across Svelte versions.
  function sortByDomOrder(list) {
    return [...list].sort((a, b) => {
      if (!a.node || !b.node) return 0;
      const position = a.node.compareDocumentPosition(b.node);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
  }

  setContext("carbon:UserAvatarGroup", {
    items,
    max: maxStore,
    size: sizeStore,
    activeTooltip,
    register: ({ id, name, node }) => {
      items.update((current) =>
        current.some((item) => item.id === id)
          ? current
          : sortByDomOrder([...current, { id, name, node }]),
      );
    },
    unregister: (id) => {
      items.update((current) => current.filter((item) => item.id !== id));
    },
    updateName: (id, name) => {
      items.update((current) =>
        current.map((item) => (item.id === id ? { ...item, name } : item)),
      );
    },
  });

  // Number of avatars actually shown: capped at `max` unless `max` is 0.
  $: visibleCount = hasLimit ? Math.min($items.length, max) : $items.length;
  // The total represented; defaults to the slotted count. Overflow is everyone
  // past the visible slots, including people not rendered when `total` is set.
  $: effectiveTotal = total ?? $items.length;
  $: overflowCount = Math.max(0, effectiveTotal - visibleCount);
  // Cap the label so it always fits the circle; counts above 99 read as "99+".
  $: overflowLabel = overflowCount > 99 ? "99+" : `+${overflowCount}`;
  // Names are known only for the slotted avatars past the visible ones.
  $: hiddenNames = $items
    .slice(visibleCount)
    .map((item) => item.name)
    .filter(Boolean);
  $: overflowTooltip = overflowTooltipText ?? hiddenNames.join(", ");

  // Overlap (stacked) when no gap is set, or when a negative gap tightens the
  // stack; a positive gap switches to a spaced row.
  $: overlap = gap == null || isNegativeGap(gap);
  // A negative gap overrides the default overlap amount via a custom property.
  $: groupStyle =
    [
      isNegativeGap(gap) && `--user-avatar-group-overlap: ${gap}`,
      $$restProps.style,
    ]
      .filter(Boolean)
      .join("; ") || undefined;

  $: groupClass = [
    "bx--user-avatar-group",
    overlap && "bx--user-avatar-group--overlap",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<Stack
  orientation="horizontal"
  gap={overlap ? 0 : gap}
  {...$$restProps}
  class={groupClass}
  style={groupStyle}
>
  <slot />
  {#if overflowCount > 0}
    <UserAvatarGroupOverflow label={overflowLabel} names={overflowTooltip} />
  {/if}
</Stack>
