<script>
  /**
   * @event {{ open: boolean }} toggle - Dispatched with the next open state after a header click.
   * @restProps {li}
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

  /**
   * Set an id for the top-level element.
   * The heading button and panel ids derive from it as `{id}-button` and
   * `{id}-content`.
   */
  export let id = uniqueId();

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { get } from "svelte/store";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  let initialDisabled = disabled;

  const ctx = getContext("carbon:Accordion");
  const unsubscribeDisableItems = ctx.disableItems.subscribe((value) => {
    if (!value && initialDisabled) return;
    disabled = value;
  });

  const itemKey = {};

  const unsubscribeOpenId = ctx.openId.subscribe((openItemId) => {
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

  $: if (disabled && open) open = false;

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
  {id}
  class:bx--accordion__item={true}
  class:bx--accordion__item--active={open}
  class:bx--accordion__item--disabled={disabled}
  class:bx--accordion__item--expanding={animation === "expanding"}
  class:bx--accordion__item--collapsing={animation === "collapsing"}
  {...wrapperProps}
  on:animationend
  on:animationend={() => {
    animation = undefined;
  }}
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      width="16"
      height="16"
      aria-hidden="true"
      class="bx--accordion__arrow"
    >
      <path d="M22 16L12 26 10.6 24.6 19.2 16 10.6 7.4 12 6z"></path>
    </svg>
    <div class:bx--accordion__title={true}>
      <slot name="title">{title ?? ""}</slot>
    </div>
  </button>
  <div
    id="{id}-content"
    class:bx--accordion__content={true}
    role={open ? "region" : undefined}
    aria-labelledby={open ? `${id}-button` : undefined}
  >
    {#if !lazy || openedOnce}
      <slot />
    {/if}
  </div>
</li>
