<script>
  /**
   * Internal "+N" overflow avatar for `UserAvatarGroup`. Shadows the group
   * context so the inner `UserAvatar` does not register as a group item.
   * @event {MouseEvent} click - The user activates the chip. Only when `interactive`.
   */

  /** @type {string} */
  export let label;

  /** @type {string} */
  export let names = "";

  /**
   * Make the chip a control that forwards `click`. With `names`, the
   * tooltip's trigger button is already the control; without, the avatar
   * renders as a button.
   */
  export let interactive = false;

  import {
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import { readable } from "svelte/store";
  import UserAvatar from "../UserAvatar/UserAvatar.svelte";
  import { noop } from "../utils/noop.js";

  const dispatch = createEventDispatcher();
  const parent = getContext("carbon:UserAvatarGroup");

  // Opt out of registration and overflow (empty items/max, no-op register) so
  // the chip is never counted or hidden, but keep sharing the parent's
  // `size`. The chip's tooltip joins the group's tooltip handoff through
  // the `TooltipGroup` context, which this does not shadow.
  setContext("carbon:UserAvatarGroup", {
    /** @type {import("svelte/store").Readable<Array<{ id: string; name: string; node?: HTMLElement }>>} */
    items: readable([]),
    max: readable(0),
    /** @type {import("svelte/store").Readable<import("./UserAvatarGroup.svelte").UserAvatarGroupProps["size"]>} */
    size: parent?.size ?? readable(undefined),
    /** @type {import("./UserAvatarGroup.svelte").CarbonUserAvatarGroupContext["register"]} */
    register: noop,
    /** @type {import("./UserAvatarGroup.svelte").CarbonUserAvatarGroupContext["unregister"]} */
    unregister: noop,
    /** @type {import("./UserAvatarGroup.svelte").CarbonUserAvatarGroupContext["updateName"]} */
    updateName: noop,
    /** @type {import("./UserAvatarGroup.svelte").CarbonUserAvatarGroupContext["updateNode"]} */
    updateNode: noop,
  });

  /** @type {null | HTMLElement} */
  let ref = null;

  /** @param {MouseEvent} event */
  function forwardClick(event) {
    dispatch("click", event);
  }

  // Without names, the avatar itself is the button.
  /** @param {MouseEvent} event */
  function handleAvatarClick(event) {
    if (interactive && !names) forwardClick(event);
  }

  // With names, the avatar is a span inside the tooltip's trigger button.
  // Listen on that button: a keyboard press clicks the button, not the span.
  /** @type {null | HTMLButtonElement} */
  $: tooltipTrigger =
    interactive && names && ref ? ref.closest("button") : null;

  /** @type {null | HTMLButtonElement} */
  let listening = null;
  $: if (tooltipTrigger !== listening) {
    listening?.removeEventListener("click", forwardClick);
    tooltipTrigger?.addEventListener("click", forwardClick);
    listening = tooltipTrigger;
  }
  onMount(() => () => listening?.removeEventListener("click", forwardClick));
</script>

<UserAvatar
  bind:ref
  class={interactive && names
    ? "bx--user-avatar-group__overflow bx--user-avatar--interactive"
    : "bx--user-avatar-group__overflow"}
  data-avatar-group-overflow="true"
  tooltipText={names}
  interactive={interactive && !names}
  on:click={handleAvatarClick}
>
  <!-- In RTL, bidi moves the sign to the far side of the count ("1+"). -->
  <span class:bx--user-avatar__text={true} dir="ltr">{label}</span>
</UserAvatar>
