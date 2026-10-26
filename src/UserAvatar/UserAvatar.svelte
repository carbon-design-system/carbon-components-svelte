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
   * @type {"sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Specify the background color rendered behind the initials or icon.
   * Set to `"auto"` to pick a stable color from `name` (or `initials`).
   * @type {"auto" | "red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray"}
   */
  export let backgroundColor = "gray";

  /**
   * Set to `"strong"` for a fill that stands further from the page: the 80
   * step in light themes and the 30 step in dark themes, as in Carbon's
   * `order-7` to `order-12` colors. Applies to every `backgroundColor`,
   * including `"auto"`.
   * @type {"default" | "strong"}
   */
  export let shade = "default";

  /**
   * Specify the user's full name. Initials are derived from the name when `initials` is not set.
   * Also the default alt text for `image`. Set `imageDescription=""` to mark the
   * image decorative when the name is already visible next to the avatar.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the initials to display. Takes priority over initials derived from `name`.
   * @type {string | undefined}
   */
  export let initials = undefined;

  /**
   * Specify an image source to render a photo.
   * Takes priority over the icon and initials.
   * If the image fails to load, the avatar falls back to the icon or initials
   * and dispatches `image:error`.
   * @type {string | undefined}
   */
  export let image = undefined;

  /**
   * Specify alternative text for the image.
   * Falls back to `imageAttributes.alt`, then `name`. Without either, the
   * image is marked decorative (`alt=""`).
   * Set to `""` to mark the image decorative when the name is already visible
   * next to the avatar, which avoids announcing it twice.
   * @type {string | undefined}
   */
  export let imageDescription = undefined;

  /**
   * Pass additional attributes through to the image element
   * (for example `loading`, `srcset`, or `referrerPolicy`).
   * Does not replace `image` or `imageDescription`. Rest props stay on the host.
   * @type {Record<string, string> | undefined}
   */
  export let imageAttributes = undefined;

  /**
   * Specify the icon to render. Falls back to a default user icon.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Specify a presence status. Renders a status indicator as the default
   * `badge` slot content. A custom `badge` slot overrides this.
   * @type {"online" | "away" | "busy" | "offline" | undefined}
   */
  export let status = undefined;

  /**
   * Specify the tooltip text. When set, the avatar is wrapped in a tooltip.
   * Do not combine with `interactive` or `href` — the tooltip trigger is already
   * focusable, and nesting an interactive avatar inside it is invalid.
   * @type {string | undefined}
   */
  export let tooltipText = undefined;

  /**
   * Set an id for the avatar element.
   * With `tooltipText`, the tooltip id derives from it as `{id}-tooltip`.
   * @type {string | undefined}
   */
  export let id = undefined;

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
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Obtain a reference to the avatar HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";
  import User from "../icons/User.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { getAvatarBackgroundColor } from "../utils/avatar-color.js";
  import { getInitials } from "../utils/initials.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  // When rendered inside a `UserAvatarGroup`, register with the group so it can
  // count avatars and hide those beyond its `max`. The group context is absent
  // for a standalone avatar, in which case none of this applies.
  const userAvatarGroup = getContext("carbon:UserAvatarGroup");
  const groupItemId = userAvatarGroup ? uniqueId("cua") : undefined;
  const groupItems = userAvatarGroup?.items ?? readable([]);
  const groupMax = userAvatarGroup?.max ?? readable(0);
  const groupSize = userAvatarGroup?.size ?? readable(undefined);

  if (userAvatarGroup) {
    // Register once mounted so the group can sort registrations into DOM order
    // via the element reference (mount order can differ from DOM order when
    // avatars are conditionally rendered).
    onMount(() => {
      userAvatarGroup.register({ id: groupItemId, name, node: ref });
      return () => {
        userAvatarGroup.unregister(groupItemId);
      };
    });
  }

  $: if (userAvatarGroup) userAvatarGroup.updateName(groupItemId, name);
  // `ref` points at a new element when the root is swapped (see `updateNode`).
  $: if (userAvatarGroup && ref) userAvatarGroup.updateNode(groupItemId, ref);
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
  $: imageAlt = imageDescription ?? imageAttributes?.alt ?? name ?? "";

  // `href` wins over `interactive`. When either is set, the avatar itself is the
  // focus target — do not nest it inside TooltipDefinition's button.
  $: isLink = typeof href === "string";
  $: isButton = !isLink && interactive;
  $: isInteractive = isLink || isButton;
  $: avatarTag = isLink ? "a" : isButton ? "button" : "span";
  // TooltipDefinition always renders a focusable button trigger. Use it only
  // when the avatar stays a non-interactive span.
  $: useTooltipWrapper = !!tooltipText && !isInteractive;
  // With the tooltip wrapper, its button takes focus, so naming and
  // description go there instead of onto the avatar span inside it.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: avatarProps,
  } = splitAriaNaming($$restProps));

  const glyphSize = { sm: 16, md: 20, lg: 24, xl: 32 };

  $: avatarInitials = initials ?? getInitials(name);
  $: resolvedBackgroundColor =
    backgroundColor === "auto"
      ? getAvatarBackgroundColor(name ?? initials ?? "")
      : backgroundColor;
  $: fill =
    shade === "strong"
      ? `${resolvedBackgroundColor}-strong`
      : resolvedBackgroundColor;
  $: avatarClass = [
    "bx--user-avatar",
    `bx--user-avatar--${resolvedSize}`,
    `bx--user-avatar--${fill}`,
    isInteractive && "bx--user-avatar--interactive",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");

  // Fall back to icon/initials when the photo URL fails. Comparing against the
  // failed URL means a new `image` value automatically retries. Forget the
  // failure once `image` moves off it, so returning to that URL retries too.
  let failedImage;
  $: if (failedImage !== undefined && image !== failedImage) {
    failedImage = undefined;
  }

  function handleImageError() {
    failedImage = image;
    dispatch("image:error");
  }

  $: hasBadge = $$slots.badge || Boolean(status);
</script>

{#if useTooltipWrapper}
  <TooltipDefinition
    class="bx--user-avatar-tooltip"
    {tooltipText}
    {align}
    {direction}
    {portalTooltip}
    id={id === undefined ? undefined : `${id}-tooltip`}
    data-overflow={groupOverflow ? "true" : undefined}
    data-avatar-group-overflow={$$restProps["data-avatar-group-overflow"]}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
  >
    {#if hasBadge}
      <span class:bx--user-avatar__badge-wrapper={true}>
        <span
          bind:this={ref}
          {id}
          {...avatarProps}
          class={avatarClass}
          on:click
          on:mouseover
          on:mouseenter
          on:mouseleave
          on:focus
          on:blur
          on:keydown
        >
          {#if $$slots.default}
            <slot />
          {:else if image && image !== failedImage}
            <img
              {...imageAttributes}
              src={image}
              alt={imageAlt}
              on:error={handleImageError}
            />
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
      </span>
    {:else}
      <span
        bind:this={ref}
        {id}
        {...avatarProps}
        class={avatarClass}
        on:click
        on:mouseover
        on:mouseenter
        on:mouseleave
        on:focus
        on:blur
        on:keydown
      >
        {#if $$slots.default}
          <slot />
        {:else if image && image !== failedImage}
          <img
            {...imageAttributes}
            src={image}
            alt={imageAlt}
            on:error={handleImageError}
          />
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
  <span
    class:bx--user-avatar__badge-wrapper={true}
    data-overflow={groupOverflow ? "true" : undefined}
    data-avatar-group-overflow={$$restProps["data-avatar-group-overflow"]}
  >
    <svelte:element
      this={avatarTag}
      bind:this={ref}
      {id}
      {...$$restProps}
      class={avatarClass}
      href={isLink ? href : undefined}
      type={isButton ? "button" : undefined}
      aria-label={$$restProps["aria-label"] ??
        (isInteractive && name ? name : undefined)}
      on:click
      on:mouseover
      on:mouseenter
      on:mouseleave
      on:focus
      on:blur
      on:keydown
    >
      {#if $$slots.default}
        <slot />
      {:else if image && image !== failedImage}
        <img
          {...imageAttributes}
          src={image}
          alt={imageAlt}
          on:error={handleImageError}
        />
      {:else if icon}
        <svelte:component this={icon} size={glyphSize[resolvedSize]} />
      {:else if avatarInitials}
        <span class:bx--user-avatar__text={true}>{avatarInitials}</span>
      {:else}
        <User size={glyphSize[resolvedSize]} />
      {/if}
    </svelte:element>
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
  </span>
{:else}
  <svelte:element
    this={avatarTag}
    bind:this={ref}
    {id}
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
    on:focus
    on:blur
    on:keydown
  >
    {#if $$slots.default}
      <slot />
    {:else if image && image !== failedImage}
      <img
        {...imageAttributes}
        src={image}
        alt={imageAlt}
        on:error={handleImageError}
      />
    {:else if icon}
      <svelte:component this={icon} size={glyphSize[resolvedSize]} />
    {:else if avatarInitials}
      <span class:bx--user-avatar__text={true}>{avatarInitials}</span>
    {:else}
      <User size={glyphSize[resolvedSize]} />
    {/if}
  </svelte:element>
{/if}
