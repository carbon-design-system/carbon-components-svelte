<script>
  /**
   * @event {{ open: boolean }} toggle - Dispatched with the next open state after a header click.
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

  /**
   * Set to `true` to disable the accordion item.
   * @bindable writable
   */
  export let disabled = false;

  /**
   * Specify a custom label for the accordion button.
   * This is important for accessibility when the accordion has no visible title.
   * @type {string}
   */
  export let ariaLabel = undefined;

  /**
   * Obtain a reference to the heading button HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Set to `true` to defer mounting the panel content until the item is first opened.
   * Once mounted, the content stays mounted for subsequent collapses.
   */
  export let lazy = false;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { get } from "svelte/store";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  let initialDisabled = disabled;

  const ctx = getContext("carbon:Accordion");
  const unsubscribeDisableItems = ctx.disableItems.subscribe((value) => {
    if (!value && initialDisabled) return;
    disabled = value;
  });

  const id = {};
  const contentId = uniqueId();
  const buttonId = uniqueId();

  const unsubscribeOpenId = ctx.openId.subscribe((openItemId) => {
    if (openItemId !== null && openItemId !== id) {
      open = false;
    }
  });

  $: if (disabled && open) open = false;

  $: if (open) {
    ctx.notifyOpen(id);
  }

  let previousType = get(ctx.typeStore);

  const unsubscribeType = ctx.typeStore.subscribe((value) => {
    if (
      value === "single" &&
      previousType !== "single" &&
      open &&
      !ctx.claimSingle(id)
    ) {
      open = false;
    }
    previousType = value;
  });

  let animation = undefined;
  let openedOnce = open;

  $: if (open) openedOnce = true;

  onMount(() => {
    return () => {
      unsubscribeDisableItems();
      unsubscribeOpenId();
      unsubscribeType();
    };
  });
</script>

<li
  class:bx--accordion__item={true}
  class:bx--accordion__item--active={open}
  class:bx--accordion__item--disabled={disabled}
  class:bx--accordion__item--expanding={animation === "expanding"}
  class:bx--accordion__item--collapsing={animation === "collapsing"}
  {...$$restProps}
  on:animationend
  on:animationend={() => {
    animation = undefined;
  }}
>
  <button
    bind:this={ref}
    id={buttonId}
    type="button"
    class:bx--accordion__heading={true}
    aria-label={ariaLabel}
    aria-expanded={open}
    aria-controls={contentId}
    {disabled}
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
  <div
    id={contentId}
    class:bx--accordion__content={true}
    role={open ? "region" : undefined}
    aria-labelledby={open ? buttonId : undefined}
  >
    {#if !lazy || openedOnce}
      <slot />
    {/if}
  </div>
</li>
