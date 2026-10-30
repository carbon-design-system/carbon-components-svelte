<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @restProps {li}
   */

  /**
   * @event {MouseEvent} click
   * @slot {{}} icon
   * @slot {{}} iconEnd
   * @deprecated use the `iconEnd` slot
   * @slot {{}} iconRight
   */

  /**
   * Specify the item text.
   * Alternatively, use the default slot.
   * @example
   * ```svelte
   * <OverflowMenuItem>
   *   <span>Custom Text</span>
   * </OverflowMenuItem>
   * ```
   */
  export let text = "Provide text";

  /**
   * Specify an icon to render to the left of the item text.
   * Alternatively, use the "icon" slot.
   * @type {Icon | undefined}
   * @example
   * ```svelte
   * <OverflowMenuItem>
   *   <Icon slot="icon" />
   * </OverflowMenuItem>
   * ```
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Specify an icon to render at the end of the item.
   * Alternatively, use the "iconEnd" slot.
   * @type {Icon | undefined}
   * @example
   * ```svelte
   * <OverflowMenuItem>
   *   <Icon slot="iconEnd" />
   * </OverflowMenuItem>
   * ```
   */
  export let iconEnd = /** @type {Icon | undefined} */ (undefined);

  /**
   * Specify an icon to render at the end of the item.
   * @deprecated use `iconEnd`
   * @type {Icon | undefined}
   */
  export let iconRight = /** @type {Icon | undefined} */ (undefined);

  /** Specify the `href` attribute if the item is a link */
  export let href = "";

  /**
   * Specify the `target` attribute if the item is a link
   * @type {import("svelte/elements").SvelteHTMLElements["a"]["target"]}
   */
  export let target = "";

  /**
   * Specify the `rel` attribute if the item is a link.
   * By default, `noopener noreferrer` is added if
   * `target="_blank"` unless `rel` is specified.
   * @type {import("svelte/elements").SvelteHTMLElements["a"]["rel"] | undefined}
   */
  export let rel = undefined;

  /** Set to `true` if the item should be focused when opening the menu */
  export let primaryFocus = false;

  /** Set to `true` to disable the item */
  export let disabled = false;

  /** Set to `true` to include a divider */
  export let hasDivider = false;

  /**
   * Specify a keyboard shortcut to show, such as `"mod+d"`. `mod` is
   * Command on Apple platforms and Ctrl elsewhere. The keys show at the end
   * of the item, and it gets `aria-keyshortcuts`. Display only: bind the
   * command itself with `onShortcut`, since the menu is usually closed. A
   * value that isn't a shortcut, such as `"⌘D"`, shows as written.
   */
  export let shortcut = "";

  /** Set to `true` to use the danger variant */
  export let danger = false;

  /** Set to `false` to omit the button `title` attribute */
  export let requireTitle = true;

  /** Set an id for the top-level element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLAnchorElement | HTMLButtonElement}
   */
  export let ref = null;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
  } from "svelte";
  import Kbd from "../Kbd/Kbd.svelte";
  import { splitAria } from "../utils/aria-naming.js";
  import {
    applePlatform,
    ariaKeyShortcuts,
    parseShortcut,
  } from "../utils/keyboard-shortcut.js";
  import { resolveLinkRel } from "../utils/link-rel.js";
  import { scrollIntoViewWithin } from "../utils/scroll-into-view-within.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const { focusedId, moveFocus, add, remove, patch, update, itemsById } =
    getContext("carbon:OverflowMenu");

  $: item = $itemsById[id];

  // Arrow keys, typeahead and the `close` detail read the registry, so keep
  // it current while the menu is open.
  $: patch(id, { text, disabled, shortcut });

  $: focused = $focusedId === id;

  $: endIcon = iconEnd ?? iconRight;

  // A shortcut that doesn't parse, such as Carbon React's free-text "⌘C",
  // shows as written, with no `aria-keyshortcuts`.
  $: parsable = parseShortcut(shortcut) !== null;

  onMount(() => {
    add({ id, text, primaryFocus, disabled, shortcut, node: ref });
    return () => remove(id);
  });

  afterUpdate(() => {
    if (ref && focused && $moveFocus) {
      // `preventScroll` keeps a portaled menu from scrolling the document;
      // scroll the item into view within the menu's own scroll container.
      ref.focus({ preventScroll: true });
      scrollIntoViewWithin(ref, '[role="menu"]');
    }
  });

  // Every `aria-*` attribute belongs on the menuitem, not the `role="none"`
  // li: naming, description, `aria-keyshortcuts` and the rest.
  $: ({ aria: ariaProps, rest: wrapperProps } = splitAria($$restProps));

  $: buttonProps = {
    ...ariaProps,
    role: "menuitem",
    tabindex: "-1",
    class: "bx--overflow-menu-options__btn",
    type: href ? undefined : "button",
    disabled: href ? undefined : disabled,
    "aria-disabled": href && disabled ? "true" : ariaProps["aria-disabled"],
    href: href ? href : undefined,
    target: href && target ? target : undefined,
    rel: resolveLinkRel(target, rel),
    title: requireTitle ? ($$slots.default ? undefined : text) : undefined,
    "aria-keyshortcuts":
      (parsable && ariaKeyShortcuts(shortcut, { apple: $applePlatform })) ||
      ariaProps["aria-keyshortcuts"],
  };

  /** @param {MouseEvent} event */
  function handleClick(event) {
    event.stopPropagation();

    if (disabled) {
      event.preventDefault();
      return;
    }

    const shouldContinue = dispatch("click", event, { cancelable: true });

    // Only update (close menu) if preventDefault was not called.
    if (shouldContinue) {
      update(id, item);
    }
  }
</script>

<li
  role="none"
  {id}
  class:bx--overflow-menu-options__option={true}
  class:bx--overflow-menu--divider={hasDivider}
  class:bx--overflow-menu-options__option--danger={danger}
  class:bx--overflow-menu-options__option--disabled={disabled}
  {...wrapperProps}
>
  {#if href}
    <a bind:this={ref} {...buttonProps} on:click={handleClick} on:keydown>
      {#if $$slots.icon || icon}
        <div
          class:bx--overflow-menu-options__option-icon={true}
          class:bx--overflow-menu-options__option-icon--left={true}
        >
          <slot name="icon"><svelte:component this={icon} /></slot>
        </div>
      {/if}
      <slot>
        <div class:bx--overflow-menu-options__option-content={true}>{text}</div>
      </slot>
      {#if shortcut}
        <span class:bx--overflow-menu-options__option-shortcut={true}>
          {#if parsable}
            <Kbd {shortcut} variant="muted" aria-hidden="true" />
          {:else}
            {shortcut}
          {/if}
        </span>
      {/if}
      {#if $$slots.iconEnd || $$slots.iconRight || endIcon}
        <div
          class:bx--overflow-menu-options__option-icon={true}
          class:bx--overflow-menu-options__option-icon--right={true}
        >
          <slot name="iconEnd"
            ><slot name="iconRight"><svelte:component this={endIcon} /></slot
            ></slot
          >
        </div>
      {/if}
    </a>
  {:else}
    <button
      type="button"
      bind:this={ref}
      {...buttonProps}
      on:click={handleClick}
      on:keydown
    >
      {#if $$slots.icon || icon}
        <div
          class:bx--overflow-menu-options__option-icon={true}
          class:bx--overflow-menu-options__option-icon--left={true}
        >
          <slot name="icon"><svelte:component this={icon} /></slot>
        </div>
      {/if}
      <slot>
        <div class:bx--overflow-menu-options__option-content={true}>{text}</div>
      </slot>
      {#if shortcut}
        <span class:bx--overflow-menu-options__option-shortcut={true}>
          {#if parsable}
            <Kbd {shortcut} variant="muted" aria-hidden="true" />
          {:else}
            {shortcut}
          {/if}
        </span>
      {/if}
      {#if $$slots.iconEnd || $$slots.iconRight || endIcon}
        <div
          class:bx--overflow-menu-options__option-icon={true}
          class:bx--overflow-menu-options__option-icon--right={true}
        >
          <slot name="iconEnd"
            ><slot name="iconRight"><svelte:component this={endIcon} /></slot
            ></slot
          >
        </div>
      {/if}
    </button>
  {/if}
</li>
