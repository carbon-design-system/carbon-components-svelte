<script>
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

  import { getContext, onMount } from "svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import { uniqueId } from "../utils/uniqueId.js";

  let initialDisabled = disabled;

  const ctx = getContext("carbon:Accordion");
  const unsubscribeDisableItems = ctx.disableItems.subscribe((value) => {
    if (!value && initialDisabled) return;
    disabled = value;
  });

  const id = {};
  const contentId = uniqueId();

  const unsubscribeOpenId = ctx.openId.subscribe((openItemId) => {
    if (openItemId !== null && openItemId !== id) {
      open = false;
    }
  });

  $: if (open) {
    ctx.notifyOpen(id);
  }

  let animation = undefined;
  let hasOpened = open;

  $: if (open) hasOpened = true;

  onMount(() => {
    return () => {
      unsubscribeDisableItems();
      unsubscribeOpenId();
    };
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
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
    }}
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
  >
    <ChevronRight class="bx--accordion__arrow" />
    <div class:bx--accordion__title={true}>
      <slot name="title">{title ?? ""}</slot>
    </div>
  </button>
  <div id={contentId} class:bx--accordion__content={true}>
    {#if !lazy || hasOpened}
      <slot />
    {/if}
  </div>
</li>
