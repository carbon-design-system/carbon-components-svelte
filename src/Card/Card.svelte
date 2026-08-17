<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @restProps {div | a}
   * @slot {{}}
   * @slot {{}} media - A CardMedia, positioned per `mediaPosition` in horizontal layout, always first outside it.
   * @slot {{}} decorator - Typically an AI-label badge, rendered top-right of the card.
   */

  /**
   * Render as a navigation card. Only takes effect when `clickable` is `true`;
   * renders an anchor instead of a div, with native keyboard handling.
   * @type {string}
   */
  export let href = undefined;

  /**
   * Set to `true` to make the entire card interactive: hover/focus/active
   * styles, keyboard activation, and a built-in footer arrow affordance.
   */
  export let clickable = false;

  /** Set to `true` to disable the card and all interactive content. */
  export let disabled = false;

  /**
   * Specify the title typography weight.
   * @type {"productive" | "expressive"}
   */
  export let density = "productive";

  /**
   * Set to `true` to render the `media` slot beside the content instead of
   * above it.
   */
  export let horizontal = false;

  /**
   * Position the `media` slot before or after the content in horizontal
   * layout. Has no effect outside `horizontal`.
   * @type {"start" | "end"}
   */
  export let mediaPosition = "start";

  /**
   * Icon rendered in the built-in footer affordance of a clickable card.
   * Only takes effect when `clickable` is `true`.
   * @type {Icon}
   */
  export let renderFooterIcon = ArrowRight;

  /**
   * Obtain a reference to the outer HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import ArrowRight from "../icons/ArrowRight.svelte";

  const horizontalStore = writable(horizontal);
  $: horizontalStore.set(horizontal);

  const clickableStore = writable(clickable);
  $: clickableStore.set(clickable);

  // CardMedia reads `horizontal` to pick AspectRatio vs. a plain sized div;
  // CardFooter reads `clickable` to warn when used inside a clickable card.
  setContext("carbon:Card", {
    horizontal: horizontalStore,
    clickable: clickableStore,
  });

  $: hasHref = clickable && Boolean(href);
  $: tag = hasHref ? "a" : "div";
  $: cardProps = hasHref
    ? disabled
      ? { role: "link", "aria-disabled": "true" }
      : {
          href,
          rel:
            $$restProps.target === "_blank" ? "noopener noreferrer" : undefined,
        }
    : clickable
      ? {
          role: "button",
          tabindex: disabled ? -1 : 0,
          "aria-disabled": disabled ? "true" : undefined,
        }
      : {};

  $: cardClass = [
    "bx--card",
    clickable && !disabled && "bx--card--clickable",
    disabled && "bx--card--disabled",
    `bx--card--${density}`,
    horizontal && "bx--card--horizontal",
    $$slots.decorator && "bx--card--has-decorator",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");

  $: if (
    clickable &&
    !$$restProps["aria-label"] &&
    !$$restProps["aria-labelledby"]
  ) {
    console.warn(
      "[Card.svelte] a clickable card must have an accessible name. Pass `aria-label` or `aria-labelledby`.",
    );
  }

  function handleKeyDown(event) {
    if (
      !hasHref &&
      clickable &&
      !disabled &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      event.currentTarget.click();
    }
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<svelte:element
  this={tag}
  bind:this={ref}
  {...$$restProps}
  {...cardProps}
  class={cardClass}
  on:click
  on:keydown
  on:keydown={handleKeyDown}
  on:focus
  on:blur
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if horizontal}
    {#if mediaPosition === "end"}
      <div class:bx--card__content={true}><slot /></div>
      <slot name="media" />
    {:else}
      <slot name="media" />
      <div class:bx--card__content={true}><slot /></div>
    {/if}
  {:else}
    <slot name="media" />
    <slot />
  {/if}
  {#if clickable}
    <div class:bx--card__clickable-footer={true} aria-hidden="true">
      <svelte:component this={renderFooterIcon} aria-hidden="true" />
    </div>
  {/if}
  {#if $$slots.decorator}
    <div
      class:bx--card__decorator={true}
      role="presentation"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <slot name="decorator" />
    </div>
  {/if}
</svelte:element>
