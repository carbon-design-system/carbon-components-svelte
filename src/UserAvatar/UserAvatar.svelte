<script>
  /** @template [Icon=any] */

  /**
   * Custom avatar content via the default slot overrides the computed image, icon, and initials.
   * @restProps {div}
   */

  /**
   * Specify the size of the avatar.
   * @type {"sm" | "md" | "lg" | "xl"}
   */
  export let size = "md";

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

  import User from "../icons/User.svelte";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";
  import { getAvatarBackgroundColor } from "../utils/avatarColor.js";

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
    `bx--user-avatar--${size}`,
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
  >
    <span
      bind:this={ref}
      {...$$restProps}
      class={avatarClass}
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
        <svelte:component this={icon} size={glyphSize[size]} />
      {:else if avatarInitials}
        <span class:bx--user-avatar__text={true}>{avatarInitials}</span>
      {:else}
        <User size={glyphSize[size]} />
      {/if}
    </span>
  </TooltipDefinition>
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <span
    bind:this={ref}
    {...$$restProps}
    class={avatarClass}
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
      <svelte:component this={icon} size={glyphSize[size]} />
    {:else if avatarInitials}
      <span class:bx--user-avatar__text={true}>{avatarInitials}</span>
    {:else}
      <User size={glyphSize[size]} />
    {/if}
  </span>
{/if}
