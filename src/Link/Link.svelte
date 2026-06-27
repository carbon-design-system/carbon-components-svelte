<script>
  /**
   * @template [Icon=any]
   */

  /**
   * Specify the size of the link.
   * @type {"sm" | "lg"}
   */
  export let size = undefined;

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

  /** Set to `true` to disable the checkbox */
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

  /** @param {Event} event */
  function preventDisabledActivation(event) {
    event.preventDefault();
    event.stopPropagation();
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-missing-attribute -->
<!-- svelte-ignore a11y-no-redundant-roles -->
<!-- svelte-ignore a11y-interactive-supports-focus -->
{#if disabled}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <a
    bind:this={ref}
    role="link"
    aria-disabled="true"
    tabindex="-1"
    class:bx--link={true}
    class:bx--link--disabled={disabled}
    class:bx--link--inline={inline}
    class:bx--link--visited={visited}
    class:bx--link--muted={muted}
    {...$$restProps}
    on:click={preventDisabledActivation}
    on:keydown={preventDisabledActivation}
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:blur
    on:keyup
  >
    <slot />
    {#if !inline && ($$slots.icon || icon)}
      <div class:bx--link__icon={true}>
        <slot name="icon"> <svelte:component this={icon} /> </slot>
      </div>
    {/if}
  </a>
{:else}
  <a
    bind:this={ref}
    class:bx--link={true}
    class:bx--link--disabled={disabled}
    class:bx--link--inline={inline}
    class:bx--link--visited={visited}
    class:bx--link--muted={muted}
    class:bx--link--sm={size === "sm"}
    class:bx--link--lg={size === "lg"}
    rel={$$restProps.target === "_blank" ? "noopener noreferrer" : undefined}
    {href}
    {...$$restProps}
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
      <div class:bx--link__icon={true}>
        <slot name="icon"> <svelte:component this={icon} /> </slot>
      </div>
    {/if}
  </a>
{/if}
