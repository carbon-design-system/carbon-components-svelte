<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @restProps {div | a}
   * @slot {{}}
   * @slot {{}} media - A `CardMedia`. Renders above the content, or beside it when `horizontal` is `true`.
   * @slot {{}} decorator - An `AILabel` or other decorator, in the header's top inline-end corner. It sits below top media and clear of media at the end, and outside a clickable card's link or button.
   */

  /**
   * Set to `true` to make the whole card interactive. It renders as a
   * button, or as a link when `href` is set, and shows `icon` at the
   * bottom. Give it an accessible name with `aria-label` or
   * `aria-labelledby`.
   */
  export let clickable = false;

  /**
   * Set the `href` to render a clickable card as a link.
   * Only applies when `clickable` is `true`.
   * @type {string}
   */
  export let href = undefined;

  /** Set to `true` to disable the card */
  export let disabled = false;

  /**
   * Specify the title type style: `"productive"` for product UI, or
   * `"expressive"` for a larger title.
   * @type {"productive" | "expressive"}
   */
  export let density = "productive";

  /**
   * Set to `true` to render the `media` slot beside the content instead
   * of above it.
   */
  export let horizontal = false;

  /**
   * Place the `media` slot before or after the content.
   * Only applies when `horizontal` is `true`.
   * @type {"start" | "end"}
   */
  export let mediaPosition = "start";

  /**
   * Specify the icon a clickable card shows in its bottom inline-end
   * corner (mirrored in right-to-left layouts), such as `Launch` for an
   * external link. The icon is decorative
   * and hidden from assistive technology. Named `icon` as on
   * `ClickableTile`; Carbon React calls it `renderFooterIcon`.
   * Only applies when `clickable` is `true`.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (ArrowRight);

  /**
   * Obtain a reference to the card element.
   * @type {null | HTMLDivElement | HTMLAnchorElement}
   * @bindable readonly
   */
  export let ref = null;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import ArrowRight from "../icons/ArrowRight.svelte";
  import { resolveLinkRel } from "../utils/link-rel.js";
  import CardWrapper from "./CardWrapper.svelte";

  const sharedHorizontal = writable(horizontal);
  $: sharedHorizontal.set(horizontal);

  const sharedClickable = writable(clickable);
  $: sharedClickable.set(clickable);

  // `CardMedia` reports its shape here, so the decorator can sit at the
  // header's corner instead of on the media.
  /** @type {import("svelte/store").Writable<null | { block: number; inline: string }>} */
  const media = writable(null);

  setContext("carbon:Card", {
    horizontal: sharedHorizontal,
    clickable: sharedClickable,
    media,
  });

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable($$slots.decorator ? "active" : undefined);

  $: link = clickable && Boolean(href);

  // Spread before `$$restProps`, so a consumer's own `role` or `tabindex`
  // wins. A disabled link drops its `href`, so it needs `role="link"`.
  $: cardProps = link
    ? disabled
      ? { role: "link", "aria-disabled": "true" }
      : { href, rel: resolveLinkRel($$restProps.target) }
    : clickable
      ? {
          role: "button",
          tabindex: disabled ? "-1" : "0",
          "aria-disabled": disabled ? "true" : undefined,
        }
      : {};

  let warned = false;

  $: if (
    clickable &&
    !warned &&
    !$$restProps["aria-label"] &&
    !$$restProps["aria-labelledby"]
  ) {
    warned = true;
    console.warn(
      "[Card.svelte] a clickable card needs an accessible name. Set `aria-label` or `aria-labelledby`.",
    );
  }
</script>

<CardWrapper
  decorated={$$slots.decorator}
  state={aiLabelState}
  {media}
  {horizontal}
  {mediaPosition}
>
  <svelte:element
    this={link ? "a" : "div"}
    bind:this={ref}
    class:bx--card={true}
    class:bx--card--clickable={clickable}
    class:bx--card--disabled={disabled}
    class:bx--card--productive={density !== "expressive"}
    class:bx--card--expressive={density === "expressive"}
    class:bx--card--horizontal={horizontal}
    class:bx--card--decorator={$$slots.decorator}
    class:bx--card--ai-label={$aiLabelState === "active"}
    {...cardProps}
    {...$$restProps}
    on:click={(event) => {
      // A disabled card ignores pointer events, but a script can still
      // click it.
      if (disabled) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }}
    on:click
    on:keydown
    on:keydown={(event) => {
      // A link already clicks on Enter. A div with `role="button"` clicks
      // on neither key.
      if (link || !clickable || disabled) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        // A held Space would click on every auto-repeat; a native button
        // activates once per press.
        if (event.repeat && event.key === " ") return;
        ref?.click();
      }
    }}
    on:keyup
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if horizontal}
      {#if mediaPosition !== "end"}
        <slot name="media" />
      {/if}
      <div class:bx--card__content={true}>
        <slot />
        {#if clickable && icon}
          <div class:bx--card__clickable-footer={true}>
            <svelte:component this={icon} aria-hidden="true" />
          </div>
        {/if}
      </div>
      {#if mediaPosition === "end"}
        <slot name="media" />
      {/if}
    {:else}
      <slot name="media" />
      <slot />
      {#if clickable && icon}
        <div class:bx--card__clickable-footer={true}>
          <svelte:component this={icon} aria-hidden="true" />
        </div>
      {/if}
    {/if}
  </svelte:element>
  <svelte:fragment slot="decorator">
    <slot name="decorator" />
  </svelte:fragment>
</CardWrapper>
