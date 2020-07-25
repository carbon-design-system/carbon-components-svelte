<script>
  /**
   * Set an id for the main element
   * @type {string} [id]
   */
  export let id = "main-content";
</script>

<main {id} class:bx--content={true} {...$$restProps}>
  <slot />
</main>
