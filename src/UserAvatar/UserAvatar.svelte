<script>
  /** @template [Icon=any] */

  /**
   * Custom avatar content via the default slot overrides the computed image, icon, and initials.
   * Compose a presence indicator or other overlay via the `badge` slot.
   * @event {null} image:error - Dispatched when the `image` URL fails to load. The avatar then falls back to the icon or initials.
   * @restProps {span | button | a}
   * @slot {{}} badge - Overlay content at the bottom-right of the avatar (for example a status dot or `BadgeIndicator`).
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
   * If the image fails to load, the avatar falls back to the icon or initials
   * and dispatches `image:error`.
   * @type {string}
   */
  export let image = undefined;

  /**
   * Specify alternative text for the image.
   * @type {string}
   */
  export let imageDescription = undefined;

  /**
   * Pass additional attributes through to the image element
   * (for example `loading`, `srcset`, or `referrerPolicy`).
   * Does not replace `image` or `imageDescription`. Rest props stay on the host.
   * @type {Record<string, string>}
   */
  export let imageAttributes = undefined;

  /**
   * Specify the icon to render. Falls back to a default user icon.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Specify a presence status. Renders a status indicator as the default
   * `badge` slot content. A custom `badge` slot overrides this.
   * @type {"online" | "away" | "busy" | "offline"}
   */
  export let status = undefined;

  /**
   * Specify the tooltip text. When set, the avatar is wrapped in a tooltip.
   * Do not combine with `interactive` or `href` — the tooltip trigger is already
   * focusable, and nesting an interactive avatar inside it is invalid.
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
   * Set to `true` to render a `button` element instead of a `span`.
   * Use when the avatar is a clickable control (for example, a custom profile menu
   * trigger). Prefer this over attaching `on:click` to a non-interactive `span`.
   * Ignored when `href` is set.
   */
  export let interactive = false;

  /**
   * Set an `href` to render an anchor element instead of a `span`.
   * Takes priority over `interactive`.
   * @type {string}
   */
  export let href = undefined;

  /**
   * Obtain a reference to the avatar HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { get, readable } from "svelte/store";
  import User from "../icons/User.svelte";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";
  import { getAvatarBackgroundColor } from "../utils/avatarColor.js";
  import { uniqueId } from "../utils/uniqueId.js";

  const dispatch = createEventDispatcher();

  // When rendered inside a `UserAvatarGroup`, register with the group so it can
  // count avatars and hide those beyond its `max`. The group context is absent
  // for a standalone avatar, in which case none of this applies.
  const userAvatarGroup = getContext("carbon:UserAvatarGroup");
  const groupItemId = userAvatarGroup ? uniqueId("cua") : undefined;
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

  // `href` wins over `interactive`. When either is set, the avatar itself is the
  // focus target — do not nest it inside TooltipDefinition's button.
  $: isLink = typeof href === "string";
  $: isButton = !isLink && interactive;
  $: isInteractive = isLink || isButton;
  $: avatarTag = isLink ? "a" : isButton ? "button" : "span";
  // TooltipDefinition always renders a focusable button trigger. Use it only
  // when the avatar stays a non-interactive span.
  $: useTooltipWrapper = !!tooltipText && !isInteractive;

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
    isInteractive && "bx--user-avatar--interactive",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");

  // Fall back to icon/initials when the photo URL fails. Comparing against the
  // failed URL means a new `image` value automatically retries without a
  // reactive reset that would fight the error handler.
  let failedImage = undefined;

  function handleImageError() {
    failedImage = image;
    dispatch("image:error");
  }

  $: hasBadge = $$slots.badge || Boolean(status);
  $: overflowAttrs = {
    "data-overflow": groupOverflow ? "true" : undefined,
  };
</script>

{#if useTooltipWrapper}
  <TooltipDefinition
    class="bx--user-avatar-tooltip"
    {tooltipText}
    {align}
    {direction}
    {portalTooltip}
    bind:open={tooltipOpen}
    on:close={releaseTooltip}
    data-overflow={groupOverflow ? "true" : undefined}
    data-avatar-group-overflow={$$restProps["data-avatar-group-overflow"]}
  >
    {#if hasBadge}
      <div class:bx--user-avatar__badge-wrapper={true}>
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
        <span class:bx--user-avatar__badge={true}>
          <slot name="badge">
            {#if status}
              <span
                class:bx--user-avatar__status={true}
                class:bx--user-avatar__status--online={status === "online"}
                class:bx--user-avatar__status--away={status === "away"}
                class:bx--user-avatar__status--busy={status === "busy"}
                class:bx--user-avatar__status--offline={status === "offline"}
                aria-hidden="true"
              ></span>
            {/if}
          </slot>
        </span>
      </div>
    {:else}
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
    {/if}
  </TooltipDefinition>
{:else if hasBadge}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class:bx--user-avatar__badge-wrapper={true}
    {...overflowAttrs}
    data-avatar-group-overflow={$$restProps["data-avatar-group-overflow"]}
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
      {:else if image && image !== failedImage}
        <img
          {...imageAttributes}
          src={image}
          alt={imageDescription}
          on:error={handleImageError}
        >
      {:else if icon}
        <svelte:component this={icon} size={glyphSize[resolvedSize]} />
      {:else if avatarInitials}
        <span class:bx--user-avatar__text={true}>{avatarInitials}</span>
      {:else}
        <User size={glyphSize[resolvedSize]} />
      {/if}
    </span>
    <span class:bx--user-avatar__badge={true}>
      <slot name="badge">
        {#if status}
          <span
            class:bx--user-avatar__status={true}
            class:bx--user-avatar__status--online={status === "online"}
            class:bx--user-avatar__status--away={status === "away"}
            class:bx--user-avatar__status--busy={status === "busy"}
            class:bx--user-avatar__status--offline={status === "offline"}
            aria-hidden="true"
          ></span>
        {/if}
      </slot>
    </span>
  </div>
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-missing-attribute -->
  <svelte:element
    this={avatarTag}
    bind:this={ref}
    {...$$restProps}
    class={avatarClass}
    href={isLink ? href : undefined}
    type={isButton ? "button" : undefined}
    aria-label={$$restProps["aria-label"] ??
      (isInteractive && name ? name : undefined)}
    data-overflow={groupOverflow ? "true" : undefined}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if $$slots.default}
      <slot />
    {:else if image && image !== failedImage}
      <img
        {...imageAttributes}
        src={image}
        alt={imageDescription}
        on:error={handleImageError}
      >
    {:else if icon}
      <svelte:component this={icon} size={glyphSize[resolvedSize]} />
    {:else if avatarInitials}
      <span class:bx--user-avatar__text={true}>{avatarInitials}</span>
    {:else}
      <User size={glyphSize[resolvedSize]} />
    {/if}
  </svelte:element>
{/if}
