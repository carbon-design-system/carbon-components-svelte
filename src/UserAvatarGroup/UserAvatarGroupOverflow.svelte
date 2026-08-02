<script>
  /**
   * Internal "+N" overflow avatar for `UserAvatarGroup`. Shadows the group
   * context so the chip does not register as a group item. The chip is the
   * tooltip trigger button (no nested button) and dispatches `trigger` on click
   * so the group can open a see-all surface.
   *
   * @event {null} trigger - The overflow chip was clicked.
   */

  /** @type {string} */
  export let label;

  /** @type {string} */
  export let names = "";

  import { createEventDispatcher, getContext, setContext } from "svelte";
  import { readable } from "svelte/store";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";

  const dispatch = createEventDispatcher();
  const parent = getContext("carbon:UserAvatarGroup");
  const sizeStore = parent?.size ?? readable(undefined);

  // Opt out of registration and overflow (empty items/max, no-op register) so
  // the chip is never counted or hidden, but keep sharing the parent's
  // `activeTooltip` and `size` so the chip coordinates with the avatars.
  setContext("carbon:UserAvatarGroup", {
    items: readable([]),
    max: readable(0),
    size: sizeStore,
    activeTooltip: parent?.activeTooltip ?? readable(null),
    register: () => {},
    unregister: () => {},
    updateName: () => {},
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
