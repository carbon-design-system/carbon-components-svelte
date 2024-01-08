<script>
  /**
   * @extends {"./ButtonSkeleton.svelte"} ButtonSkeletonProps
   * @restProps {button | a | div}
   * @slot {{ props: { role: "button"; type?: string; tabindex: any; disabled: boolean; href?: string; class: string; [key: string]: any; } }}
   */

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
  export let isSelected = false;

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
   * Set to `true` to render a custom HTML element
   * Props are destructured as `props` in the default slot (e.g., <Button let:props><div {...props}>...</div></Button>)
   */
  export let as = false;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

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

  import { getContext } from "svelte";
  import ButtonSkeleton from "./ButtonSkeleton.svelte";

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
      hasIconOnly && kind === "ghost" && !href ? isSelected : undefined,
    ...$$restProps,
    class: [
      "cds--btn",
      expressive && "cds--btn--expressive",
      ((size === "small" && !expressive) ||
        (size === "sm" && !expressive) ||
        (size === "small" && !expressive)) &&
        "cds--btn--sm",
      ((size === "field" && !expressive) || (size === "md" && !expressive)) &&
        "cds--btn--md",
      size === "small" && "cds--btn--sm",
      size === "xl" && "cds--btn--xl",
      size === "2xl" && "cds--btn--2xl",
      kind && `cds--btn--${kind}`,
      disabled && "cds--btn--disabled",
      hasIconOnly && "cds--btn--icon-only",
      hasIconOnly && "cds--tooltip__trigger",
      hasIconOnly && "cds--tooltip--a11y",
      hasIconOnly &&
        tooltipPosition &&
        `cds--btn--icon-only--${tooltipPosition}`,
      hasIconOnly &&
        tooltipAlignment &&
        `cds--tooltip--align-${tooltipAlignment}`,
      hasIconOnly && isSelected && kind === "ghost" && "cds--btn--selected",
      $$restProps.class,
    ]
      .filter(Boolean)
      .join(" "),
  };
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if skeleton}
  <ButtonSkeleton
    href="{href}"
    size="{size}"
    {...$$restProps}
    style="{hasIconOnly && 'width: 3rem;'}"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else if as}
  <slot props="{buttonProps}" />
{:else if href && !disabled}
  <!-- svelte-ignore a11y-missing-attribute -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <a
    bind:this="{ref}"
    {...buttonProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if hasIconOnly}
      <span class:cds--assistive-text="{true}">{iconDescription}</span>
    {/if}
    <slot /><svelte:component
      this="{icon}"
      aria-hidden="true"
      class="cds--btn__icon"
      aria-label="{iconDescription}"
    />
  </a>
{:else}
  <button
    bind:this="{ref}"
    {...buttonProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#if hasIconOnly}
      <span class:cds--assistive-text="{true}">{iconDescription}</span>
    {/if}
    <slot /><svelte:component
      this="{icon}"
      aria-hidden="true"
      class="cds--btn__icon"
      style="{hasIconOnly ? 'margin-left: 0' : undefined}"
      aria-label="{iconDescription}"
    />
  </button>
{/if}
