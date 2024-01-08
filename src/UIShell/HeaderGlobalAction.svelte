<script>
  /** Set to `true` to use the active variant */
  export let isActive = false;

  /**
   * Specify the icon to render
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let icon = undefined;

  /** Obtain a reference to the HTML button element */
  export let ref = null;
</script>

<button
  type="button"
  bind:this="{ref}"
  class:cds--header__action="{true}"
  class:cds--header__action--active="{isActive}"
  class:cds--btn--icon-only="{true}"
  {...$$restProps}
  on:click
>
  <slot>
    <svelte:component this="{icon}" size="{20}" />
  </slot>
</button>
