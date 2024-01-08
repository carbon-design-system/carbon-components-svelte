<script>
  /** Set to `true` to use the active state */
  export let linkIsActive = false;

  /**
   * Specify the `href` attribute
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the icon to render
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let icon = undefined;

  /** Obtain a reference to the HTML anchor element */
  export let ref = null;
</script>

<a
  bind:this="{ref}"
  class:cds--header__action="{true}"
  class:cds--header__action--active="{linkIsActive}"
  class:cds--btn--icon-only="{true}"
  href="{href}"
  rel="{$$restProps.target === '_blank' ? 'noopener noreferrer' : undefined}"
  {...$$restProps}
  on:click
>
  <slot name="icon">
    <svelte:component this="{icon}" size="{20}" />
  </slot>
</a>

<style>
  .cds--header__action {
    color: var(--bx-text-primary);
  }
</style>
