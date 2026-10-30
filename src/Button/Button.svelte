<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   */

  /**
   * @extendProps {"./ButtonSkeleton.svelte"} ButtonSkeletonProps
   * @restProps {button | a | div}
   * @slot {{ props: { role: "button"; type?: string; tabindex: any; disabled: boolean; href?: string; class: string; [key: string]: any; } }}
   * @slot {{ style: undefined | string; }} icon
   * @slot {{}} badge - Compose a `BadgeIndicator` overlaid on an icon-only button. Size is set to `lg` automatically.
   * @event {KeyboardEvent} shortcut - Dispatched when `shortcut` is pressed, before the button is clicked. Call `preventDefault()` to skip the click.
   */

  /**
   * Specify the kind of button.
   * @type {"primary" | "secondary" | "tertiary" | "ghost" | "danger" | "danger-tertiary" | "danger-ghost"}
   */
  export let kind = "primary";

  /**
   * Specify the size of button.
   * When the `badge` slot is used, size is set to `lg` per Carbon design guidelines.
   * Falls back to the size set by an ancestor `ActionSet` when unset, then
   * to the height of a parent `Form`'s size (`xs`, `small` for `sm`,
   * `default` for `xl`).
   * Use `"xs"` for icon-only buttons in dense layouts.
   * Also accepts Carbon v11's `"sm"` (`"small"`), `"md"` (`"field"`) and
   * `"2xl"` (`"xl"`). `"lg"` and `"xl"` keep this library's 64px and 80px;
   * Carbon v11's 48px `lg` and 64px `xl` are `"default"` and `"lg"` here.
   * @type {"default" | "field" | "small" | "xs" | "lg" | "xl" | "sm" | "md" | "2xl" | undefined}
   * @default "default"
   */
  export let size = undefined;

  /** Set to `true` to use Carbon's expressive typesetting */
  export let expressive = false;

  /**
   * Set to `true` to enable the selected state for an icon-only, ghost button.
   */
  export let isSelected = false;

  /**
   * Set to `true` to render an icon-only button even when default content
   * is passed (default content isn't rendered), as from a wrapper that
   * forwards optional text; `false` to always render a labelled button.
   * Unset, a button with an icon and no default content is icon-only.
   * Without an icon, the button is always labelled.
   * @type {boolean | undefined}
   */
  export let iconOnly = undefined;

  /** Set to `true` to span the full width of the container */
  export let fullWidth = false;

  /**
   * Specify the icon to render.
   * Alternatively, use the named slot "icon".
   *
   * @type {Icon | undefined}
   * @example
   * ```svelte
   * <Button>
   *   <Icon slot="icon" size={20} />
   * </Button>
   * ```
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Specify the ARIA label for the button icon.
   * On an icon-only button, this also drives Carbon's tooltip. If omitted,
   * the icon-only button renders without a tooltip; supply your own
   * `aria-label` or `aria-labelledby` for accessibility in that case.
   * @type {string | undefined}
   */
  export let iconDescription = undefined;

  /**
   * Specify a keyboard shortcut for the button, such as `"mod+s"`. `mod` is
   * Command on Apple platforms and Ctrl elsewhere. The button shows the
   * keys (in its tooltip when icon-only), sets `aria-keyshortcuts`, and is
   * clicked when the shortcut is pressed while it's enabled and shown, and,
   * while a modal is open, inside it. A shortcut the app binds with
   * `onShortcut` takes precedence.
   */
  export let shortcut = "";

  /**
   * Set the tooltip placement in floating-ui form: the side, then `start`
   * or `end` along it, as Popover's `align` takes. Above and below,
   * `start` and `end` name inline sides, so they swap under `dir="rtl"`.
   * When set, takes precedence over `tooltipPosition` and `tooltipAlignment`.
   * @type {"top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end" | undefined}
   */
  export let tooltipAlign = undefined;

  /**
   * Set the alignment of the tooltip relative to the icon.
   * Only applies to icon-only buttons.
   * @deprecated use `tooltipAlign`
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /**
   * Set the position of the tooltip relative to the icon.
   * @deprecated use `tooltipAlign`
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /**
   * Set to `true` to hide the tooltip while maintaining accessibility.
   * Only applies to icon-only buttons.
   * When `true`, the tooltip is visually hidden but the `iconDescription` remains accessible to screen readers.
   */
  export let hideTooltip = false;

  /**
   * Set to `true` to render a custom HTML element.
   * Props are destructured as `props` in the default slot.
   * @example
   * ```svelte
   * <Button let:props>
   *   <div {...props}>Custom Element</div>
   * </Button>
   * ```
   */
  export let as = false;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  /** Set to `true` to disable the button */
  export let disabled = false;

  /**
   * Set the `href` to use an anchor link.
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /** Specify the `type` attribute for the button element */
  export let type = "button";

  /**
   * Obtain a reference to the HTML element.
   * Stays `null` when `as` is set; use `bind:this` on your own element instead.
   * @bindable readonly
   * @type {null | HTMLAnchorElement | HTMLButtonElement}
   */
  export let ref = null;

  /**
   * Set to `true` to always render the icon-only tooltip in a portal, which
   * also flips it when the preferred direction lacks space, or `false` to
   * keep it in place. Left unset, the tooltip opens in a portal inside a
   * `Modal`, or when a box around it (`overflow` other than `visible`, such
   * as a `DataTable`) would cut it off.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  /**
   * Set to `true` to display a loading spinner in place of the icon
   * and prevent the button from being activated.
   * Unlike `disabled`, the button remains focusable; use `disabled`
   * as well if it should also be removed from the tab order.
   */
  export let loading = false;

  /**
   * Specify the accessible description for the loading spinner.
   * @type {string | undefined}
   */
  export let loadingDescription = undefined;

  /**
   * Wait this many milliseconds after `loading` turns `true` before showing
   * the spinner. Once shown, the spinner stays for at least 500 ms, so fast
   * work shows nothing and slow work never flashes. The button blocks clicks
   * and sets `aria-busy` as soon as `loading` is `true`.
   * Set to `0` to show the spinner at once.
   */
  export let loadingDelay = 0;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Kbd from "../Kbd/Kbd.svelte";
  import Loading from "../Loading/Loading.svelte";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { iconTooltipPortalGaps } from "../Portal/icon-tooltip-portal-gaps.js";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import {
    FORM_SIZE_CONTEXT_KEY,
    MODAL_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import { createLoadingIndicator } from "../utils/delayed-loading.js";
  import { dismiss } from "../utils/dismiss.js";
  import { clippedBy } from "../utils/fit-align.js";
  import { formButtonSize } from "../utils/form-button-size.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import {
    applePlatform,
    ariaKeyShortcuts,
    keyboardShortcut,
  } from "../utils/keyboard-shortcut.js";
  import { resolveLinkRel } from "../utils/link-rel.js";
  import { noop } from "../utils/noop.js";
  import { BUTTON_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { tooltipPlacement } from "../utils/tooltip-align.js";
  import { ignoreTooltipClicks } from "../utils/tooltip-clicks.js";
  import { closeOverControls } from "../utils/tooltip-cover.js";
  import { getTooltipGroup } from "../utils/tooltip-group.js";
  import { createTooltipHandoff } from "../utils/tooltip-handoff.js";
  import ButtonSkeleton from "./ButtonSkeleton.svelte";

  const insideModal = getContext(MODAL_CONTEXT_KEY);
  const actionSetSize = getContext("carbon:ActionSet")?.size;
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  // Inside an `InputGroup`, match the height of the group's fields.
  const inputGroupSize = getContext("carbon:InputGroup")?.buttonSize;

  $: hasIconOnly =
    Boolean(icon || $$slots.icon) && (iconOnly ?? !$$slots.default);

  // `loading` blocks clicks and sets aria-busy at once. Only the spinner, and
  // the disabled look that comes with it, wait for `loadingDelay`. With no
  // delay the spinner follows `loading` exactly, as before.
  let showSpinner = loading;
  const loadingIndicator = createLoadingIndicator((shown) => {
    showSpinner = shown;
  });
  $: loadingIndicator(loading, loadingDelay);
  // Without an iconDescription there is nothing to show in a tooltip or
  // announce as the accessible name via the assistive-text span; skip the
  // whole tooltip apparatus and let the consumer's own aria-label/
  // aria-labelledby (passed through $$restProps) carry accessibility instead.
  // While loading, Loading's own <title> + aria-live carries the accessible
  // name instead, so the tooltip is suppressed to avoid double-announcing.
  $: hasTooltipContent =
    hasIconOnly && Boolean(iconDescription) && !showSpinner;
  // Set for one open when the in-place tooltip turns out to be cut off by
  // a box around it (a scrolling panel, a DataTable): it shows in a portal
  // instead. Only when `portalTooltip` is left unset.
  let portalWhenClipped = false;
  $: effectivePortalTooltip =
    portalTooltip === undefined
      ? !!insideModal || portalWhenClipped
      : portalTooltip;
  $: usePortal = hasTooltipContent && !hideTooltip && effectivePortalTooltip;
  $: hasTooltip = hasTooltipContent && !hideTooltip && !usePortal;

  // Warm-handoff hover/focus scheduling: only one tooltip can be open at a
  // time. When another tooltip claims the active slot, this one closes
  // immediately — preventing overlapping tooltips (e.g. Pagination's
  // adjacent buttons).
  const tooltipHandoff = createTooltipHandoff({ group: getTooltipGroup() });
  const tooltipActive = tooltipHandoff.active;
  const tooltipOthersActive = tooltipHandoff.hidden;
  const tooltipInstant = tooltipHandoff.instant;

  let hovered = false;
  let focused = false;
  // Set by Escape. The tooltip stays hidden while the button keeps hover
  // or focus, until the next pointer enter or focus (WCAG 1.4.13).
  let dismissed = false;
  // CSS `:hover` shows the inline tooltip, so the hidden class holds it back
  // while a hover waits out the group's enter delay, as TooltipIcon's does.
  // A warm handoff from a neighbor opens it at once. Before hydration, and
  // on the server, CSS alone shows it.
  let tooltipShown = false;

  $: portalOpen =
    usePortal &&
    !disabled &&
    !dismissed &&
    (hovered || focused) &&
    $tooltipActive;
  // `tooltipShown` holds through the leave delay, so the pointer can move
  // onto the tooltip.
  $: inlineOpen =
    hasTooltip && !disabled && !dismissed && tooltipShown && $tooltipActive;

  // The in-place tooltip is laid out while hidden, so it measures where it
  // shows. Measured after the update, so the swap lands before paint.
  $: if (inlineOpen) tick().then(portalIfClipped);
  $: if (!inlineOpen && !portalOpen) endClippedOpen();

  function portalIfClipped() {
    const tooltip = ref?.querySelector(":scope > .bx--assistive-text");
    if (portalTooltip !== undefined || !inlineOpen || !tooltip) return;
    if (clippedBy(tooltip)) portalWhenClipped = true;
  }

  // Back in place for the next open to measure, and closed there too:
  // the portal path never clears `tooltipShown`.
  function endClippedOpen() {
    if (!portalWhenClipped) return;
    portalWhenClipped = false;
    tooltipShown = false;
  }

  function dismissPortalTooltip() {
    tooltipHandoff.cancel();
    hovered = false;
    focused = false;
    tooltipHandoff.release();
  }

  // Re-attach the portal observer so the tooltip dismisses when an
  // ancestor modal closes (mirrors CopyButton).
  let disconnectModalObserver = noop;

  $: {
    disconnectModalObserver();
    disconnectModalObserver =
      usePortal && ref
        ? observeModalClose(ref, dismissPortalTooltip)
        : () => {};
  }

  $: tooltipHidden = hasTooltipContent && !hideTooltip && $tooltipOthersActive;

  function handleMouseenter() {
    if (!hasTooltip) return;
    hovered = true;
    dismissed = false;
    tooltipHandoff.scheduleEnter(() => {
      tooltipShown = true;
    });
  }

  function handleMouseleave() {
    if (!hasTooltip) return;
    hovered = false;
    tooltipHandoff.scheduleLeave(() => {
      if (focused) return;
      tooltipShown = false;
      tooltipHandoff.release();
    });
  }

  function handlePortalMouseEnter() {
    if (!usePortal || disabled) return;
    dismissed = false;
    tooltipHandoff.scheduleEnter(() => {
      hovered = true;
    });
  }

  function handlePortalMouseLeave() {
    if (!usePortal) return;
    tooltipHandoff.scheduleLeave(() => {
      hovered = false;
      if (!focused) tooltipHandoff.release();
    });
  }

  // The pointer moved onto the portalled tooltip: keep it open.
  function handleTooltipMouseenter() {
    if (portalOpen) tooltipHandoff.cancel();
  }

  // The pointer moved onto a part of the tooltip that covers another
  // control, such as the next button in a row: close at once, so the
  // pointer and the next click reach that control. Hidden as by Escape
  // until the next pointer enter or focus.
  function handleTooltipCover() {
    tooltipHandoff.cancel();
    dismissed = true;
    tooltipShown = false;
    if (usePortal) hovered = false;
    tooltipHandoff.release();
  }

  // Focus shows the tooltip at once, without the fade-in. Focus the
  // library moved here itself, such as a modal's first focus, did not ask
  // for the tooltip. Treat it as dismissed, so Escape reaches the modal,
  // until the next pointer enter or focus.
  function handleFocus() {
    if (!(hasTooltip || usePortal) || disabled) return;
    focused = true;
    dismissed = !tooltipHandoff.claimFocus(ref);
    tooltipShown = !dismissed;
  }

  // Listens on `window` in the capture phase, as TooltipIcon does, so a
  // hovered tooltip also hides while focus is elsewhere, and an ancestor
  // such as a Modal doesn't also see the Escape that hid it.
  function handleKeydown(event) {
    if (event.key !== "Escape" || !(portalOpen || inlineOpen)) return;
    // Escape that cancels an IME composition is not a dismissal.
    if (isImeComposition(event)) return;
    event.stopPropagation();
    dismissed = true;
    tooltipShown = false;
    tooltipHandoff.dismiss();
  }

  $: escapeListener = {
    enabled: portalOpen || inlineOpen,
    type: "keydown",
    handler: handleKeydown,
    options: { capture: true },
  };

  function handleBlur() {
    if (!(hasTooltip || usePortal)) return;
    focused = false;
    if (hovered) return;
    tooltipShown = false;
    tooltipHandoff.release();
  }

  $: portalGaps = iconTooltipPortalGaps(
    effectiveTooltipPosition,
    effectiveTooltipAlignment,
  );

  onMount(() => {
    return () => {
      tooltipHandoff.cancel();
      loadingIndicator.cancel();
      disconnectModalObserver();
      tooltipHandoff.release();
    };
  });

  // Native `disabled` is reserved for the `disabled` prop. `loading` alone
  // never sets it: disabling the element the user just clicked steals focus
  // (browsers move it to <body>), which is jarring for keyboard/screen
  // reader users mid-submit. Loading instead keeps the element focusable,
  // marks it with aria-disabled, and blocks the click itself (see
  // handleClick) — the same pattern Modal's primaryButtonLoading already
  // uses, minus the focus loss.
  $: isDisabled = Boolean(disabled);
  $: isVisuallyDisabled = isDisabled || showSpinner;
  $: effectiveSize = $$slots.badge
    ? "lg"
    : (normalizeSize(size, BUTTON_SIZE_ALIASES) ??
      $actionSetSize ??
      $inputGroupSize ??
      formButtonSize($formSize) ??
      "default");
  $: iconProps = {
    "aria-hidden": "true",
    class: "bx--btn__icon",
  };

  /** @param {MouseEvent} event */
  function handleClick(event) {
    if (loading) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  const dispatch = createEventDispatcher();

  // Pressing the shortcut clicks the button, so it takes the same path as a
  // pointer: `on:click`, a form submit, a link's navigation.
  /** @param {KeyboardEvent} event */
  function runShortcut(event) {
    if (dispatch("shortcut", event, { cancelable: true })) ref?.click();
  }

  $: shortcutParams = { shortcut, run: runShortcut };
  $: hasShortcutHint = Boolean(shortcut) && !hasIconOnly;
  // Without an icon for the spinner to replace, it takes the keys' place
  // instead, and the hidden keys keep the button's width.
  $: spinnerInShortcut = hasShortcutHint && !icon && !$$slots.icon;
  $: buttonProps = {
    type: href && !isDisabled ? undefined : type,
    tabindex,
    disabled: isDisabled ? true : undefined,
    href: href && !isDisabled ? href : undefined,
    rel: href && !isDisabled ? resolveLinkRel($$restProps.target) : undefined,
    "aria-pressed":
      hasIconOnly && kind === "ghost" && !href ? isSelected : undefined,
    "aria-busy": loading || undefined,
    "aria-keyshortcuts": shortcut
      ? ariaKeyShortcuts(shortcut, { apple: $applePlatform }) || undefined
      : undefined,
    "aria-disabled": loading || undefined,
    ...$$restProps,
    class: [
      "bx--btn",
      expressive && "bx--btn--expressive",
      effectiveSize === "xs" && "bx--btn--xs",
      effectiveSize === "small" && "bx--btn--sm",
      effectiveSize === "field" && "bx--btn--field",
      effectiveSize === "lg" && "bx--btn--lg",
      effectiveSize === "xl" && "bx--btn--xl",
      kind && `bx--btn--${kind}`,
      fullWidth && "bx--btn--full-width",
      isVisuallyDisabled && "bx--btn--disabled",
      hasIconOnly && "bx--btn--icon-only",
      hasShortcutHint && "bx--btn--shortcut",
      spinnerInShortcut && "bx--btn--shortcut-end",
      hasShortcutHint && !spinnerInShortcut && "bx--btn--shortcut-icon",
      hasTooltip && "bx--tooltip__trigger",
      hasTooltip && "bx--tooltip--a11y",
      hasTooltip &&
        effectiveTooltipPosition &&
        `bx--btn--icon-only--${effectiveTooltipPosition}`,
      hasTooltip &&
        effectiveTooltipAlignment &&
        `bx--tooltip--align-${effectiveTooltipAlignment}`,
      hasTooltip &&
        (tooltipHidden ||
          (dismissed && (hovered || focused)) ||
          (hovered && !tooltipShown)) &&
        "bx--tooltip--hidden",
      inlineOpen && "bx--tooltip--visible",
      hasTooltip && $tooltipInstant && "bx--tooltip--instant",
      hasIconOnly && isSelected && kind === "ghost" && "bx--btn--selected",
      $$restProps.class,
    ]
      .filter(Boolean)
      .join(" "),
  };

  $: ({
    position: effectiveTooltipPosition,
    alignment: effectiveTooltipAlignment,
  } = tooltipPlacement(tooltipAlign, tooltipPosition, tooltipAlignment));
</script>

{#if skeleton}
  <ButtonSkeleton
    {href}
    size={effectiveSize}
    {...$$restProps}
    style={[hasIconOnly && "width: 3rem;", $$restProps.style]
      .filter(Boolean)
      .join(" ") || undefined}
    on:click
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else if as}
  <slot props={buttonProps} />
{:else if href && !isDisabled}
  {#if $$slots.badge}
    <div class:bx--btn__badge-wrapper={true}>
      <a
        bind:this={ref}
        use:dismiss={escapeListener}
        use:keyboardShortcut={shortcutParams}
        use:ignoreTooltipClicks
        use:closeOverControls={{ onCover: handleTooltipCover }}
        {...buttonProps}
        on:click={handleClick}
        on:click
        on:mousedown
        on:focus
        on:focus={handleFocus}
        on:blur
        on:blur={handleBlur}
        on:mouseover
        on:mouseenter
        on:mouseenter={handleMouseenter}
        on:mouseenter={handlePortalMouseEnter}
        on:mouseleave
        on:mouseleave={handleMouseleave}
        on:mouseleave={handlePortalMouseLeave}
      >
        {#if hasIconOnly && iconDescription && !showSpinner}
          <span class:bx--assistive-text={true}
            >{iconDescription}{#if shortcut}<span
                class:bx--btn__tooltip-shortcut={true}
                aria-hidden="true"><Kbd {shortcut} variant="muted" /></span
              >{/if}</span
          >
        {/if}
        {#if !hasIconOnly}
          <slot />
          {#if shortcut}
            <span class:bx--btn__shortcut={true}>
              {#if showSpinner && spinnerInShortcut}
                <Loading
                  small
                  withOverlay={false}
                  description={loadingDescription}
                  class="bx--btn__loading"
                />
              {/if}
              <Kbd {shortcut} variant="muted" aria-hidden="true" />
            </span>
          {/if}
        {/if}
        {#if showSpinner && !spinnerInShortcut}
          <Loading
            small
            withOverlay={false}
            description={loadingDescription}
            class="bx--btn__loading"
            style={hasIconOnly ? "margin-inline-start: 0" : undefined}
          />
        {:else if $$slots.icon}
          <slot
            name="icon"
            style={hasIconOnly ? "margin-inline-start: 0" : undefined}
            {...iconProps}
          />
        {:else if icon}
          <svelte:component
            this={icon}
            style={hasIconOnly ? "margin-inline-start: 0" : undefined}
            {...iconProps}
          />
        {/if}
      </a>
      <slot name="badge" />
    </div>
  {:else}
    <a
      bind:this={ref}
      use:dismiss={escapeListener}
      use:keyboardShortcut={shortcutParams}
      use:ignoreTooltipClicks
      use:closeOverControls={{ onCover: handleTooltipCover }}
      {...buttonProps}
      on:click={handleClick}
      on:click
      on:mousedown
      on:focus
      on:focus={handleFocus}
      on:blur
      on:blur={handleBlur}
      on:mouseover
      on:mouseenter
      on:mouseenter={handleMouseenter}
      on:mouseenter={handlePortalMouseEnter}
      on:mouseleave
      on:mouseleave={handleMouseleave}
      on:mouseleave={handlePortalMouseLeave}
    >
      {#if hasIconOnly && iconDescription && !showSpinner}
        <span class:bx--assistive-text={true}
          >{iconDescription}{#if shortcut}<span
              class:bx--btn__tooltip-shortcut={true}
              aria-hidden="true"><Kbd {shortcut} variant="muted" /></span
            >{/if}</span
        >
      {/if}
      {#if !hasIconOnly}
        <slot />
        {#if shortcut}
          <span class:bx--btn__shortcut={true}>
            {#if showSpinner && spinnerInShortcut}
              <Loading
                small
                withOverlay={false}
                description={loadingDescription}
                class="bx--btn__loading"
              />
            {/if}
            <Kbd {shortcut} variant="muted" aria-hidden="true" />
          </span>
        {/if}
      {/if}
      {#if showSpinner && !spinnerInShortcut}
        <Loading
          small
          withOverlay={false}
          description={loadingDescription}
          class="bx--btn__loading"
          style={hasIconOnly ? "margin-inline-start: 0" : undefined}
        />
      {:else if $$slots.icon}
        <slot
          name="icon"
          style={hasIconOnly ? "margin-inline-start: 0" : undefined}
          {...iconProps}
        />
      {:else if icon}
        <svelte:component
          this={icon}
          style={hasIconOnly ? "margin-inline-start: 0" : undefined}
          {...iconProps}
        />
      {/if}
    </a>
  {/if}
{:else if $$slots.badge}
  <div class:bx--btn__badge-wrapper={true}>
    <button
      type="button"
      bind:this={ref}
      use:dismiss={escapeListener}
      use:keyboardShortcut={shortcutParams}
      use:ignoreTooltipClicks
      use:closeOverControls={{ onCover: handleTooltipCover }}
      {...buttonProps}
      on:click={handleClick}
      on:click
      on:mousedown
      on:focus
      on:focus={handleFocus}
      on:blur
      on:blur={handleBlur}
      on:mouseover
      on:mouseenter
      on:mouseenter={handleMouseenter}
      on:mouseenter={handlePortalMouseEnter}
      on:mouseleave
      on:mouseleave={handleMouseleave}
      on:mouseleave={handlePortalMouseLeave}
    >
      {#if hasIconOnly && iconDescription && !showSpinner}
        <span class:bx--assistive-text={true}
          >{iconDescription}{#if shortcut}<span
              class:bx--btn__tooltip-shortcut={true}
              aria-hidden="true"><Kbd {shortcut} variant="muted" /></span
            >{/if}</span
        >
      {/if}
      {#if !hasIconOnly}
        <slot />
        {#if shortcut}
          <span class:bx--btn__shortcut={true}>
            {#if showSpinner && spinnerInShortcut}
              <Loading
                small
                withOverlay={false}
                description={loadingDescription}
                class="bx--btn__loading"
              />
            {/if}
            <Kbd {shortcut} variant="muted" aria-hidden="true" />
          </span>
        {/if}
      {/if}
      {#if showSpinner && !spinnerInShortcut}
        <Loading
          small
          withOverlay={false}
          description={loadingDescription}
          class="bx--btn__loading"
          style={hasIconOnly ? "margin-inline-start: 0" : undefined}
        />
      {:else if $$slots.icon}
        <slot
          name="icon"
          style={hasIconOnly ? "margin-inline-start: 0" : undefined}
          {...iconProps}
        />
      {:else if icon}
        <svelte:component
          this={icon}
          style={hasIconOnly ? "margin-inline-start: 0" : undefined}
          {...iconProps}
        />
      {/if}
    </button>
    <slot name="badge" />
  </div>
{:else}
  <button
    type="button"
    bind:this={ref}
    use:dismiss={escapeListener}
    use:keyboardShortcut={shortcutParams}
    use:ignoreTooltipClicks
    use:closeOverControls={{ onCover: handleTooltipCover }}
    {...buttonProps}
    on:click={handleClick}
    on:click
    on:mousedown
    on:focus
    on:focus={handleFocus}
    on:blur
    on:blur={handleBlur}
    on:mouseover
    on:mouseenter
    on:mouseenter={handleMouseenter}
    on:mouseenter={handlePortalMouseEnter}
    on:mouseleave
    on:mouseleave={handleMouseleave}
    on:mouseleave={handlePortalMouseLeave}
  >
    {#if hasIconOnly && iconDescription && !showSpinner}
      <span class:bx--assistive-text={true}
        >{iconDescription}{#if shortcut}<span
            class:bx--btn__tooltip-shortcut={true}
            aria-hidden="true"><Kbd {shortcut} variant="muted" /></span
          >{/if}</span
      >
    {/if}
    {#if !hasIconOnly}
      <slot />
      {#if shortcut}
        <span class:bx--btn__shortcut={true}>
          {#if showSpinner && spinnerInShortcut}
            <Loading
              small
              withOverlay={false}
              description={loadingDescription}
              class="bx--btn__loading"
            />
          {/if}
          <Kbd {shortcut} variant="muted" aria-hidden="true" />
        </span>
      {/if}
    {/if}
    {#if showSpinner && !spinnerInShortcut}
      <Loading
        small
        withOverlay={false}
        description={loadingDescription}
        class="bx--btn__loading"
        style={hasIconOnly ? "margin-inline-start: 0" : undefined}
      />
    {:else if $$slots.icon}
      <slot
        name="icon"
        style={hasIconOnly ? "margin-inline-start: 0" : undefined}
        {...iconProps}
      />
    {:else if icon}
      <svelte:component
        this={icon}
        style={hasIconOnly ? "margin-inline-start: 0" : undefined}
        {...iconProps}
      />
    {/if}
  </button>
{/if}

{#if usePortal}
  <PortalTooltip
    anchor={ref}
    direction={effectiveTooltipPosition}
    open={portalOpen}
    text={iconDescription}
    tooltipType="icon"
    intrinsicAlign={effectiveTooltipAlignment}
    horizontalGapLeft={portalGaps.horizontalGapLeft}
    horizontalGapRight={portalGaps.horizontalGapRight}
    gapTop={portalGaps.gapTop}
    gapBottom={portalGaps.gapBottom}
    verticalAlignOffsetLeft={portalGaps.verticalAlignOffsetLeft}
    verticalAlignOffsetRight={portalGaps.verticalAlignOffsetRight}
    on:mouseenter={handleTooltipMouseenter}
    on:mouseleave={handlePortalMouseLeave}
    on:cover={handleTooltipCover}
    >{iconDescription}{#if shortcut}<span
        class:bx--btn__tooltip-shortcut={true}
        aria-hidden="true"><Kbd {shortcut} variant="muted" /></span
      >{/if}</PortalTooltip
  >
{/if}
