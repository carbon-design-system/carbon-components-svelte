<script>
  import Nav from "../components/Nav.svelte";

  export let segment;
</script>

<style>
  main {
    margin-top: 3rem;
  }
</style>

<Nav {segment} />

<main>
  <slot />
</main>
