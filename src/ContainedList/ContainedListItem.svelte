<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @restProps {a | button | div}
   */

  /** Set to `true` to render a `button` element instead of a `div` */
  export let interactive = false;

  /** Set to `true` to disable the list item */
  export let disabled = false;

  /**
   * Set to `true` to mark an `interactive` or `href` item as the current
   * one, such as the item whose details show beside the list. It gets a
   * selected fill and `aria-current`.
   */
  export let selected = false;

  /**
   * Specify the `href` attribute.
   * Renders an anchor with clickable styles. Takes precedence over `interactive`.
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Specify the icon to render.
   * Icon is rendered to the left of the item content.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  import { resolveLinkRel } from "../utils/link-rel.js";

  $: isLink = Boolean(href);
  $: isDisabledLink = isLink && disabled;
  $: isClickable = isLink || interactive;
  $: tag = isLink ? "a" : interactive ? "button" : "div";
  $: props = {
    type: tag === "button" ? "button" : undefined,
    disabled: tag === "button" ? disabled : undefined,
    href: isLink && !disabled ? href : undefined,
    rel: isLink && !disabled ? resolveLinkRel($$restProps.target) : undefined,
    role: isDisabledLink ? "link" : undefined,
    "aria-disabled": isDisabledLink ? "true" : undefined,
    "aria-current": isClickable && selected ? "true" : undefined,
  };
</script>

<li
  class:bx--contained-list-item={true}
  class:bx--contained-list-item--clickable={isClickable}
  class:bx--contained-list-item--selected={isClickable && selected}
  class:bx--contained-list-item--with-icon={icon}
  class:bx--contained-list-item--with-action={$$slots.action}
>
  <svelte:element
    this={tag}
    {...props}
    {...$$restProps}
    on:click={(event) => {
      if (!isDisabledLink) return;
      // Runs before the forwarded `click`, so a disabled link never reaches
      // a consumer's handler.
      event.preventDefault();
      event.stopImmediatePropagation();
    }}
    on:click
    class:bx--contained-list-item__content={true}
  >
    {#if icon}
      <div class:bx--contained-list-item__icon={true}>
        <svelte:component this={icon} />
      </div>
    {/if}
    <div><slot /></div>
  </svelte:element>
  {#if $$slots.action}
    <div class:bx--contained-list-item__action={true}>
      <slot name="action" />
    </div>
  {/if}
</li>
