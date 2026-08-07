<script>
  /**
   * Set the `href` to use an anchor link.
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the size of button skeleton.
   * `"default"`, `"field"`, and `"small"` are deprecated aliases for `"lg"`, `"md"`, and `"sm"`
   * kept for backward compatibility.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "default" | "field" | "small"}
   */
  export let size = "default";

  $: isXs = size === "xs";
  $: isSm = size === "small" || size === "sm";
  $: isMd = size === "field" || size === "md";
  $: isLg = size === "lg";
  $: isXl = size === "xl";
  $: is2xl = size === "2xl";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if href}
  <a
    {href}
    rel={$$restProps.target === "_blank" ? "noopener noreferrer" : undefined}
    role="button"
    class:bx--skeleton={true}
    class:bx--btn={true}
    class:bx--btn--xs={isXs}
    class:bx--btn--sm={isSm}
    class:bx--btn--field={isMd}
    class:bx--btn--lg-48={isLg}
    class:bx--btn--lg={isXl}
    class:bx--btn--xl={is2xl}
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
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class:bx--skeleton={true}
    class:bx--btn={true}
    class:bx--btn--xs={isXs}
    class:bx--btn--sm={isSm}
    class:bx--btn--field={isMd}
    class:bx--btn--lg-48={isLg}
    class:bx--btn--lg={isXl}
    class:bx--btn--xl={is2xl}
    {...$$restProps}
    on:click
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseleave
  ></div>
{/if}
