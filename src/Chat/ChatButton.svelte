<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @extendProps {"../Button/Button.svelte"} ButtonProps
   */

  /**
   * Specify the kind of button.
   * A quick action is always `"ghost"`.
   * @type {"primary" | "secondary" | "tertiary" | "ghost" | "danger"}
   */
  export let kind = "primary";

  /**
   * Specify the size of button.
   * A quick action is always `"small"`.
   * Falls back to the height of a parent `Form`'s size, as Button does.
   * @type {"default" | "field" | "small" | undefined}
   * @default "default"
   */
  export let size = undefined;

  /**
   * Set to `true` to render a quick action: a small, outlined pill, such
   * as a suggested reply under a chat message.
   */
  export let quickAction = false;

  /**
   * Set to `true` to mark a quick action as selected.
   * Screen readers hear it as a pressed toggle button.
   * Only applies to quick actions.
   */
  export let selected = false;

  /**
   * Specify the icon to render.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Obtain a reference to the HTML element.
   * @type {null | HTMLAnchorElement | HTMLButtonElement}
   * @bindable readonly
   */
  export let ref = null;

  import Button from "../Button/Button.svelte";

  // A pressed state belongs on a button, not on a link.
  $: pressed =
    quickAction && !$$restProps.href ? { "aria-pressed": selected } : {};
</script>

<Button
  bind:ref
  {...pressed}
  {...$$restProps}
  kind={quickAction ? "ghost" : kind}
  size={quickAction ? "small" : size}
  {icon}
  class={[
    "bx--chat-btn",
    icon && "bx--chat-btn--with-icon",
    quickAction && "bx--chat-btn--quick-action",
    quickAction && selected && "bx--chat-btn--quick-action--selected",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ")}
  on:click
  on:mousedown
  on:focus
  on:blur
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</Button>
