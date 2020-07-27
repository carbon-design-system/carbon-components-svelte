<script>
  /**
   * Specify the id for the main element
   * @type {string} [id="main-content"]
   */
  export let id = "main-content";
</script>

<main {id} class:bx--content={true} {...$$restProps}>
  <slot />
</main>
