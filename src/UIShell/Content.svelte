<script>
  /** Specify the id for the main element */
  export let id = "main-content";
</script>

<main id="{id}" class:bx--content="{true}" {...$$restProps}>
  <slot />
</main>
