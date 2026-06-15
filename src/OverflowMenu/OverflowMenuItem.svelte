<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @event {MouseEvent} click
   * @slot {{}} icon
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
   * @type {Icon}
   * @example
   * ```svelte
   * <OverflowMenuItem>
   *   <Icon slot="icon" />
   * </OverflowMenuItem>
   * ```
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Specify an icon to render pinned to the right edge of the item.
   * Alternatively, use the "iconRight" slot.
   * @type {Icon}
   * @example
   * ```svelte
   * <OverflowMenuItem>
   *   <Icon slot="iconRight" />
   * </OverflowMenuItem>
   * ```
   */
  export let iconRight = /** @type {Icon} */ (undefined);

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
   * @type {import("svelte/elements").SvelteHTMLElements["a"]["rel"]}
   */
  export let rel = undefined;

  /** Set to `true` if the item should be focused when opening the menu */
  export let primaryFocus = false;

  /** Set to `true` to disable the item */
  export let disabled = false;

  /** Set to `true` to include a divider */
  export let hasDivider = false;

  /** Set to `true` to use the danger variant */
  export let danger = false;

  /** Set to `false` to omit the button `title` attribute */
  export let requireTitle = true;

  /** Set an id for the top-level element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
  } from "svelte";

  const dispatch = createEventDispatcher();
  const { focusedId, add, remove, update, itemsById } = getContext(
    "carbon:OverflowMenu",
  );

  $: item = $itemsById[id];

  add({ id, text, primaryFocus, disabled });

  $: focused = $focusedId === id;

  onMount(() => () => remove(id));

  afterUpdate(() => {
    if (ref && focused) {
      ref.focus({ preventScroll: true });
    }
  });

  $: buttonProps = {
    role: "menuitem",
    tabindex: "-1",
    class: "bx--overflow-menu-options__btn",
    type: href ? undefined : "button",
    disabled: href ? undefined : disabled,
    "aria-disabled": href && disabled ? "true" : undefined,
    href: href ? href : undefined,
    target: href && target ? target : undefined,
    rel:
      rel === undefined
        ? target === "_blank"
          ? "noopener noreferrer"
          : undefined
        : rel,
    title: requireTitle ? ($$slots.default ? undefined : text) : undefined,
  };

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
  {...$$restProps}
>
  {#if href}
    <!-- svelte-ignore a11y-missing-attribute -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
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
      {#if $$slots.iconRight || iconRight}
        <div
          class:bx--overflow-menu-options__option-icon={true}
          class:bx--overflow-menu-options__option-icon--right={true}
        >
          <slot name="iconRight"><svelte:component this={iconRight} /></slot>
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
      {#if $$slots.iconRight || iconRight}
        <div
          class:bx--overflow-menu-options__option-icon={true}
          class:bx--overflow-menu-options__option-icon--right={true}
        >
          <slot name="iconRight"><svelte:component this={iconRight} /></slot>
        </div>
      {/if}
    </button>
  {/if}
</li>
