<script>
  /**
   * @event {{ open: boolean }} toggle - Dispatched with the next open state after a header click.
   * @restProps {li}
   * @slot {{}} extra
   */

  /**
   * Specify the title of the accordion item heading.
   * Alternatively, use the "title" slot.
   * @type {string | undefined}
   * @example
   * ```svelte
   * <AccordionItem>
   *   <div slot="title">Custom Title</div>
   * </AccordionItem>
   * ```
   */
  export let title = undefined;

  /**
   * Set to `true` to open the first accordion item.
   * @bindable writable
   */
  export let open = false;

  /** Set to `true` to disable the accordion item */
  export let disabled = false;

  /**
   * Specify a custom label for the accordion button.
   * This is important for accessibility when the accordion has no visible title.
   * @type {string | undefined}
   */
  export let ariaLabel = undefined;

  /**
   * Obtain a reference to the heading button HTML element.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  /**
   * Set to `true` to defer mounting the panel content until the item is first opened.
   * Once mounted, the content stays mounted for subsequent collapses.
   */
  export let lazy = false;

  /**
   * Set an id for the top-level element.
   * The heading button and panel ids derive from it as `{id}-button` and
   * `{id}-content`.
   */
  export let id = uniqueId();

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { get } from "svelte/store";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  const ctx = getContext("carbon:Accordion");
  const { disableItems } = ctx;

  const itemKey = {};

  // An item added after mount with `open` takes over, as setting `open` on
  // an existing item does. On the first render, the first open item wins.
  let claimOnMount = open && ctx.isMounted();

  const unsubscribeOpenId = ctx.openId.subscribe((openItemId) => {
    if (claimOnMount) {
      claimOnMount = false;
      return;
    }
    if (openItemId !== null && openItemId !== itemKey) {
      open = false;
    }
  });

  // Naming and description belong on the heading button, not the `li`.
  // A consumer `aria-label` wins over the `ariaLabel` prop.
  $: ({
    ariaLabel: restAriaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  // Derived, not written back to `disabled`, so the item's own value
  // survives the Accordion's `disabled` toggling on and off.
  $: isDisabled = disabled || $disableItems;

  $: if (isDisabled && open) open = false;

  $: if (open) {
    ctx.notifyOpen(itemKey);
  }

  let previousType = get(ctx.typeStore);

  const unsubscribeType = ctx.typeStore.subscribe((value) => {
    if (
      value === "single" &&
      previousType !== "single" &&
      open &&
      !ctx.claimSingle(itemKey)
    ) {
      open = false;
    }
    previousType = value;
  });

  let animation;
  let openedOnce = open;

  $: if (open) openedOnce = true;

  onMount(() => {
    return () => {
      // A stale owner would force-close the next item mounted with `open`.
      if (get(ctx.openId) === itemKey) ctx.openId.set(null);
      unsubscribeOpenId();
      unsubscribeType();
    };
  });

  $: hasExtra = $$slots.extra;
</script>

<li
  {id}
  class:bx--accordion__item={true}
  class:bx--accordion__item--active={open}
  class:bx--accordion__item--disabled={isDisabled}
  class:bx--accordion__item--expanding={animation === "expanding"}
  class:bx--accordion__item--collapsing={animation === "collapsing"}
  {...wrapperProps}
  on:animationend
>
  <div
    class:bx--accordion__heading-row={hasExtra}
    style:display={hasExtra ? undefined : "contents"}
  >
    <button
      bind:this={ref}
      id="{id}-button"
      type="button"
      class:bx--accordion__heading={true}
      aria-label={restAriaLabel ?? ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-expanded={open}
      aria-controls="{id}-content"
      disabled={isDisabled}
      on:click
      on:click={() => {
        open = !open;
        animation = open ? "expanding" : "collapsing";
        dispatch("toggle", { open });
      }}
      on:mouseover
      on:mouseenter
      on:mouseleave
      on:focus
      on:blur
      on:keydown
    >
      <ChevronRight class="bx--accordion__arrow" />
      <div class:bx--accordion__title={true}>
        <slot name="title">{title ?? ""}</slot>
      </div>
    </button>
    {#if hasExtra}
      <div class:bx--accordion__extra={true}>
        <slot name="extra" />
      </div>
    {/if}
  </div>
  <!-- Only the content animates; `self` ignores descendants' bubbled events. -->
  <div
    id="{id}-content"
    class:bx--accordion__content={true}
    on:animationend|self={() => {
      animation = undefined;
    }}
    role={open ? "region" : undefined}
    aria-labelledby={open ? `${id}-button` : undefined}
  >
    {#if !lazy || openedOnce}
      <slot />
    {/if}
  </div>
</li>
