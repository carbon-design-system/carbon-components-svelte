<svelte:options accessors />

<script lang="ts">
  import StarRating from "carbon-components-svelte/StarRating/StarRating.svelte";

  export let value = 0;
</script>

<form data-testid="form">
  <StarRating bind:value name="rating" legendText="Rating" />
</form>
