<script>
  /**
   * @template [Icon=any]
   */

  /**
   * Specify the size of the link.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Specify the href value.
   * @type {string}
   */
  export let href = undefined;

  /** Set to `true` to use the inline variant */
  export let inline = false;

  /**
   * Specify the icon to render.
   * `inline` must be `false`.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /** Set to `true` to disable the link */
  export let disabled = false;

  /** Set to `true` to allow visited styles */
  export let visited = false;

  /**
   * Set to `true` to inherit the surrounding text color instead of the
   * link color. Use for inline links within body text.
   */
  export let muted = false;

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { resolveLinkRel } from "../utils/link-rel.js";
</script>

<a
  bind:this={ref}
  role={disabled ? "link" : undefined}
  aria-disabled={disabled ? "true" : undefined}
  class:bx--link={true}
  class:bx--link--disabled={disabled}
  class:bx--link--inline={inline}
  class:bx--link--visited={visited}
  class:bx--link--muted={muted}
  class:bx--link--sm={!disabled && size === "sm"}
  class:bx--link--lg={!disabled && size === "lg"}
  rel={disabled ? undefined : resolveLinkRel($$restProps.target)}
  href={disabled ? undefined : href}
  {...$$restProps}
  on:click={(event) => {
    if (!disabled) return;
    // Runs before the forwarded `click`, so a disabled link never reaches
    // a consumer's handler.
    event.preventDefault();
    event.stopImmediatePropagation();
  }}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
  on:keydown
  on:keyup
>
  <slot />
  {#if !inline && ($$slots.icon || icon)}
    <span class:bx--link__icon={true}>
      <slot name="icon"> <svelte:component this={icon} /> </slot>
    </span>
  {/if}
</a>
