<script>
  /** @template [Icon=any] */

  /**
   * Custom avatar content via the default slot overrides the computed image, icon, and initials.
   * @restProps {div}
   */

  /**
   * Specify the size of the avatar.
   * Defaults to `"md"`, or to the `size` of a parent `UserAvatarGroup`.
   * @type {"sm" | "md" | "lg" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the background color rendered behind the initials or icon.
   * Set to `"auto"` to pick a stable color from `name` (or `initials`).
   * @type {"auto" | "red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray"}
   */
  export let backgroundColor = "gray";

  /**
   * Specify the user's full name. Initials are derived from the name when `initials` is not set.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Specify the initials to display. Takes priority over initials derived from `name`.
   * @type {string}
   */
  export let initials = undefined;

  /**
   * Specify an image source to render a photo.
   * Takes priority over the icon and initials.
   * @type {string}
   */
  export let image = undefined;

  /**
   * Specify alternative text for the image.
   * @type {string}
   */
  export let imageDescription = undefined;

  /**
   * Specify the icon to render. Falls back to a default user icon.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Specify the tooltip text. When set, the avatar is wrapped in a tooltip.
   * @type {string}
   */
  export let tooltipText = undefined;

  /**
   * Set the alignment of the tooltip relative to the avatar.
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set the direction of the tooltip relative to the avatar.
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /**
   * Set to `false` to render the tooltip inline instead of in a floating portal.
   * The portal prevents the tooltip from being clipped by the avatar's `overflow: hidden`
   * frame or an `overflow: hidden` container such as a `Modal`.
   * @type {boolean}
   */
  export let portalTooltip = true;

  /**
   * Obtain a reference to the avatar HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { get, readable } from "svelte/store";
  import User from "../icons/User.svelte";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";
  import { getAvatarBackgroundColor } from "../utils/avatarColor.js";

  // When rendered inside a `UserAvatarGroup`, register with the group so it can
  // count avatars and hide those beyond its `max`. The group context is absent
  // for a standalone avatar, in which case none of this applies.
  const userAvatarGroup = getContext("carbon:UserAvatarGroup");
  const groupItemId = userAvatarGroup
    ? `cua-${Math.random().toString(36).slice(2)}`
    : undefined;
  const groupItems = userAvatarGroup?.items ?? readable([]);
  const groupMax = userAvatarGroup?.max ?? readable(0);
  const groupSize = userAvatarGroup?.size ?? readable(undefined);
  const groupActiveTooltip = userAvatarGroup?.activeTooltip ?? readable(null);

  // In a group, only one avatar tooltip shows at a time. Hovering an avatar
  // claims a shared store on pointer enter (before the tooltip's open delay);
  // any other open tooltip closes immediately when a neighbor claims it (same
  // approach as ContentSwitcher's icon-only tooltips).
  let tooltipOpen = false;
  let releaseTimeout;
  $: if (
    userAvatarGroup &&
    tooltipOpen &&
    $groupActiveTooltip !== null &&
    $groupActiveTooltip !== groupItemId
  ) {
    tooltipOpen = false;
  }

  function claimTooltip() {
    if (!userAvatarGroup) return;
    clearTimeout(releaseTimeout);
    const previous = get(groupActiveTooltip);
    userAvatarGroup.activeTooltip.set(groupItemId);
    // Warm handoff: if another avatar already has its tooltip open, skip the
    // enter delay (same pattern as ContentSwitcher's icon-only tooltips).
    if (previous !== null && previous !== groupItemId) {
      tooltipOpen = true;
    }
  }

  function releaseTooltip() {
    if (userAvatarGroup && get(groupActiveTooltip) === groupItemId) {
      userAvatarGroup.activeTooltip.set(null);
    }
  }

  // Defer release so moving between neighbors within 300ms skips the next
  // enter delay.
  function scheduleRelease() {
    clearTimeout(releaseTimeout);
    releaseTimeout = setTimeout(releaseTooltip, 300);
  }

  if (userAvatarGroup) {
    // Register once mounted so the group can sort registrations into DOM order
    // via the element reference (mount order can differ from DOM order when
    // avatars are conditionally rendered).
    onMount(() => {
      userAvatarGroup.register({ id: groupItemId, name, node: ref });
      return () => {
        clearTimeout(releaseTimeout);
        userAvatarGroup.unregister(groupItemId);
      };
    });
  }

  $: if (userAvatarGroup) userAvatarGroup.updateName(groupItemId, name);
  $: groupIndex = userAvatarGroup
    ? $groupItems.findIndex((item) => item.id === groupItemId)
    : -1;
  // Avatars past the group's `max` are hidden (the group renders a "+N" overflow
  // avatar in their place). `$groupMax` of 0 means "no limit."
  $: groupOverflow =
    userAvatarGroup &&
    $groupMax > 0 &&
    groupIndex >= 0 &&
    groupIndex >= $groupMax;
  // Fall back to the group's size, then to "md".
  $: resolvedSize = size ?? $groupSize ?? "md";

  const glyphSize = { sm: 16, md: 20, lg: 24, xl: 32 };
  const WHITESPACE = /\s+/;

  function formatInitials(value) {
    if (!value) return "";
    return value
      .trim()
      .split(WHITESPACE)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  $: avatarInitials = initials ?? formatInitials(name);
  $: resolvedBackgroundColor =
    backgroundColor === "auto"
      ? getAvatarBackgroundColor(name ?? initials ?? "")
      : backgroundColor;
  $: avatarClass = [
    "bx--user-avatar",
    `bx--user-avatar--${resolvedSize}`,
    `bx--user-avatar--${resolvedBackgroundColor}`,
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

{#if tooltipText}
  <TooltipDefinition
    class="bx--user-avatar-tooltip"
    {tooltipText}
    {align}
    {direction}
    {portalTooltip}
    bind:open={tooltipOpen}
    on:close={releaseTooltip}
    data-overflow={groupOverflow ? "true" : undefined}
  >
    <span
      bind:this={ref}
      {...$$restProps}
      class={avatarClass}
      on:click
      on:mouseover
      on:mouseenter
      on:mouseenter={claimTooltip}
      on:mouseleave
      on:mouseleave={scheduleRelease}
    >
      {#if $$slots.default}
        <slot />
      {:else if image}
        <img src={image} alt={imageDescription}>
      {:else if icon}
        <svelte:component this={icon} size={glyphSize[resolvedSize]} />
      {:else if avatarInitials}
        <span class:bx--user-avatar__text={true}>{avatarInitials}</span>
      {:else}
        <User size={glyphSize[resolvedSize]} />
      {/if}
    </span>
  </TooltipDefinition>
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <span
    bind:this={ref}
    {...$$restProps}
    class={avatarClass}
    data-overflow={groupOverflow ? "true" : undefined}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.default}
      <slot />
    {:else if image}
      <img src={image} alt={imageDescription}>
    {:else if icon}
      <svelte:component this={icon} size={glyphSize[resolvedSize]} />
    {:else if avatarInitials}
      <span class:bx--user-avatar__text={true}>{avatarInitials}</span>
    {:else}
      <User size={glyphSize[resolvedSize]} />
    {/if}
  </span>
{/if}
