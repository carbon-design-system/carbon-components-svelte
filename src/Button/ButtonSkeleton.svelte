<script>
  /**
   * Set the `href` to use an anchor link.
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Specify the size of button skeleton.
   * Falls back to the height of a parent `Form`'s size, as Button does.
   * Accepts the same Carbon v11 aliases as Button.
   * @type {"default" | "field" | "small" | "xs" | "lg" | "xl" | "sm" | "md" | "2xl" | undefined}
   * @default "default"
   */
  export let size = undefined;

  import { getContext } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import { formButtonSize } from "../utils/form-button-size.js";
  import { resolveLinkRel } from "../utils/link-rel.js";
  import { BUTTON_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize =
    normalizeSize(size, BUTTON_SIZE_ALIASES) ??
    formButtonSize($formSize) ??
    "default";
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
    class:bx--btn--field={effectiveSize === "field"}
    class:bx--btn--xs={effectiveSize === "xs"}
    class:bx--btn--sm={effectiveSize === "small"}
    class:bx--btn--lg={effectiveSize === "lg"}
    class:bx--btn--xl={effectiveSize === "xl"}
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
    class:bx--btn--field={effectiveSize === "field"}
    class:bx--btn--xs={effectiveSize === "xs"}
    class:bx--btn--sm={effectiveSize === "small"}
    class:bx--btn--lg={effectiveSize === "lg"}
    class:bx--btn--xl={effectiveSize === "xl"}
    {...$$restProps}
    on:click
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseleave
  ></div>
{/if}
