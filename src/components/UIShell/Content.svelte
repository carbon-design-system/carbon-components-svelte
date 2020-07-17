<script>
  export let id = "main-content";
</script>

<main {...$$props} {id} class:bx--content={true}>
  <slot />
</main>
