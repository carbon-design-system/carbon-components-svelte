<script>
  /**
   * Internal "+N" overflow avatar for `UserAvatarGroup`. Shadows the group
   * context so the chip does not register as a group item. Renders a button
   * that dispatches `trigger` when clicked.
   */

  /** @type {string} */
  export let label;

  /** @type {string} */
  export let names = "";

  import { createEventDispatcher, getContext, setContext } from "svelte";
  import { readable } from "svelte/store";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";
  import { noop } from "../utils/noop.js";

  const dispatch = createEventDispatcher();
  const parent = getContext("carbon:UserAvatarGroup");
  const sizeStore = parent?.size ?? readable(undefined);

  // Opt out of registration and overflow (empty items/max, no-op register) so
  // the chip is never counted or hidden, but keep sharing the parent's
  // `size`. The chip's tooltip joins the group's tooltip handoff through
  // the `TooltipGroup` context, which this does not shadow.
  setContext("carbon:UserAvatarGroup", {
    items: readable([]),
    max: readable(0),
    /** @type {import("svelte/store").Readable<import("./UserAvatarGroup.svelte").UserAvatarGroupProps["size"]>} */
    size: sizeStore,
    /** @type {import("./UserAvatarGroup.svelte").CarbonUserAvatarGroupContext["register"]} */
    register: noop,
    /** @type {import("./UserAvatarGroup.svelte").CarbonUserAvatarGroupContext["unregister"]} */
    unregister: noop,
    /** @type {import("./UserAvatarGroup.svelte").CarbonUserAvatarGroupContext["updateName"]} */
    updateName: noop,
    /** @type {import("./UserAvatarGroup.svelte").CarbonUserAvatarGroupContext["updateNode"]} */
    updateNode: noop,
  });

  function handleClick() {
    dispatch("trigger");
  }

  $: resolvedSize = $sizeStore ?? "md";
  $: triggerClass = [
    "bx--user-avatar",
    "bx--user-avatar-group__overflow",
    "bx--user-avatar--interactive",
    `bx--user-avatar--${resolvedSize}`,
    "bx--user-avatar--gray",
  ].join(" ");
</script>

{#if names}
  <TooltipDefinition
    class="bx--user-avatar-tooltip"
    tooltipText={names}
    {triggerClass}
    portalTooltip={true}
    data-avatar-group-overflow="true"
    on:click={handleClick}
  >
    <span class:bx--user-avatar__text={true}>{label}</span>
  </TooltipDefinition>
{:else}
  <button
    type="button"
    class={triggerClass}
    data-avatar-group-overflow="true"
    on:click={handleClick}
  >
    <span class:bx--user-avatar__text={true}>{label}</span>
  </button>
{/if}
