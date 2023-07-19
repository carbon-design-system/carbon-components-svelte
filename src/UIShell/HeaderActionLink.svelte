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
  class:bx--header__action="{true}"
  class:bx--header__action--active="{linkIsActive}"
  href="{href}"
  rel="{$$restProps.target === '_blank' ? 'noopener noreferrer' : undefined}"
  {...$$restProps}
>
  <slot name="icon">
    <svelte:component this="{icon}" size="{20}" />
  </slot>
</a>

<style>
  .bx--header__action {
    display: flex;
    align-items: center;
    justify-content: center;
    /** Hot fix to align icon with `HeaderAction` */
    padding-bottom: 2px;
  }
</style>
