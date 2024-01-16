<script>
  /**
   * Specify the kind of button
   * @type {"primary" | "secondary" | "tertiary" | "ghost" | "danger" | "danger--tertiary" | "danger--ghost"}
   */
  export let kind = "primary";

  /**
   * Specify the size of button
   * @type {"sm" | "md" | "lg" | "xl" | "2xl"}
   */
  export let size = "lg";

  /** Set to `true` to use Carbon's expressive typesetting */
  export let expressive = false;

  /**
   * Set to `true` to enable the selected state for an icon-only, ghost button
   */
  export let selected = false;

  /**
   * Specify the icon to render
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let icon = undefined;

  /**
   * Specify the ARIA label for the button icon
   * @type {string}
   */
  export let iconDescription = undefined;

  /**
   * Set the alignment of the tooltip relative to the icon.
   * Only applies to icon-only buttons
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /**
   * Set the position of the tooltip relative to the icon
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /**
   * Specify an element name to render as the button.
   * Be sure to provide
   * @type {keyof import('svelte/elements').SvelteHTMLElements}
   */
  export let as = undefined;

  /** Set to `true` to disable the button */
  export let disabled = false;

  /**
   * Set the `href` to use an anchor link
   * @type {string}
   */
  export let href = undefined;

  /** Specify the tabindex */
  export let tabindex = "0";

  /** Specify the `type` attribute for the button element */
  export let type = "button";

  /** Obtain a reference to the HTML element */
  export let ref = null;

  /**
   * Button, anchor, or div attributes
   * @type {import('svelte/elements').HTMLAnchorAttributes |
   * import('svelte/elements').HTMLButtonAttributes | import('svelte/elements').HTMLAttributes}
   */
  export let buttonAttributes = {};

  import { getContext } from "svelte";

  const ctx = getContext("ComposedModal");

  $: if (ctx && ref) {
    ctx.declareRef(ref);
  }
  $: hasIconOnly = icon && !$$slots.default;
  $: buttonProps = {
    type: href && !disabled ? undefined : type,
    tabindex,
    disabled: disabled === true ? true : undefined,
    href,
    "aria-pressed":
      hasIconOnly && kind === "ghost" && !href ? selected : undefined,
    class: [
      "bx--btn",
      expressive && "bx--btn--expressive",
      `bx--layout--size-${size}`,
      `bx--btn--${kind}`,
      disabled && "bx--btn--disabled",
      hasIconOnly && "bx--btn--icon-only",
      hasIconOnly && "bx--tooltip__trigger",
      hasIconOnly && "bx--tooltip--a11y",
      hasIconOnly &&
        tooltipPosition &&
        `bx--btn--icon-only--${tooltipPosition}`,
      hasIconOnly &&
        tooltipAlignment &&
        `bx--tooltip--align-${tooltipAlignment}`,
      hasIconOnly && selected && kind === "ghost" && "bx--btn--selected",
    ]
      .filter(Boolean)
      .join(" "),
  };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<svelte:element
  this="{as || (href && 'a') || 'button'}"
  bind:this="{ref}"
  type="{href && !disabled ? undefined : type}"
  tab-index="{tabindex}"
  disabled="{disabled}"
  href="{href}"
  aria-pressed="{hasIconOnly && kind === 'ghost' && !href
    ? selected
    : undefined}"
  class:bx--btn="{true}"
  class:bx--btn--expressive="{expressive}"
  class:bx--layout--size-sm="{size === 'sm'}"
  class:bx--layout--size-md="{size === 'md'}"
  class:bx--layout--size-lg="{size === 'lg'}"
  class:bx--layout--size-xl="{size === 'xl'}"
  class:bx--layout--size-2xl="{size === '2xl'}"
  class:bx--btn--primary="{kind === 'primary'}"
  class:bx--btn--secondary="{kind === 'secondary'}"
  class:bx--btn--tertiary="{kind === 'tertiary'}"
  class:bx--btn--ghost="{kind === 'ghost'}"
  class:bx--btn--danger="{kind === 'danger'}"
  class:bx--btn--danger--tertiary="{kind === 'danger--tertiary'}"
  class:bx--btn--danger--ghost="{kind === 'danger--ghost'}"
  class:bx--btn--icon-only="{hasIconOnly}"
  class:bx--btn--icon-only--top="{hasIconOnly &&
    tooltipPosition &&
    tooltipPosition === 'top'}"
  class:bx--btn--icon-only--right="{hasIconOnly &&
    tooltipPosition &&
    tooltipPosition === 'right'}"
  class:bx--btn--icon-only--bottom="{hasIconOnly &&
    tooltipPosition &&
    tooltipPosition === 'bottom'}"
  class:bx--btn--icon-only--left="{hasIconOnly &&
    tooltipPosition &&
    tooltipPosition === 'left'}"
  class:bx--btn--icon-only--start="{hasIconOnly &&
    tooltipAlignment &&
    tooltipAlignment === 'start'}"
  class:bx--btn--icon-only--center="{hasIconOnly &&
    tooltipAlignment &&
    tooltipAlignment === 'center'}"
  class:bx--btn--icon-only--end="{hasIconOnly &&
    tooltipAlignment &&
    tooltipAlignment === 'end'}"
  class:bx--tooltip="{hasIconOnly}"
  {...buttonAttributes}
  on:click
  on:focus
  on:blur
  on:pointerover
  on:pointerenter
  on:pointerleave
>
  {#if hasIconOnly}
    <span class:bx--assistive-text="{true}" class:bx--tooltip-content="{true}"
      >{iconDescription}</span
    >
  {/if}
  <slot /><svelte:component
    this="{icon}"
    aria-hidden="true"
    class="bx--btn__icon"
    style="{hasIconOnly ? 'margin-left: 0' : undefined}"
    aria-label="{iconDescription}"
  />
</svelte:element>
