<script>
  /**
   * Set the `href` to use an anchor link.
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the size of button skeleton.
   * @type {"default" | "field" | "small" | "xs" | "lg" | "xl"}
   */
  export let size = "default";

  import { resolveLinkRel } from "../utils/link-rel.js";
</script>

{#if href}
  <a
    {href}
    rel={resolveLinkRel($$restProps.target)}
    role="button"
    tabindex="-1"
    aria-hidden="true"
    class:bx--skeleton={true}
    class:bx--btn={true}
    class:bx--btn--field={size === "field"}
    class:bx--btn--xs={size === "xs"}
    class:bx--btn--sm={size === "small"}
    class:bx--btn--lg={size === "lg"}
    class:bx--btn--xl={size === "xl"}
    {...$$restProps}
    on:click
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {""}
  </a>
{:else}
  <div
    class:bx--skeleton={true}
    class:bx--btn={true}
    class:bx--btn--field={size === "field"}
    class:bx--btn--xs={size === "xs"}
    class:bx--btn--sm={size === "small"}
    class:bx--btn--lg={size === "lg"}
    class:bx--btn--xl={size === "xl"}
    {...$$restProps}
    on:click
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseleave
  ></div>
{/if}
