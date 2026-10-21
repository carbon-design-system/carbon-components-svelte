<svelte:options accessors />

<script lang="ts">
  import StarRating from "carbon-components-svelte/StarRating/StarRating.svelte";

  export let value = 0;
  /** Place the rating outside its form, tied to it by the `form` attribute. */
  export let outside = false;
</script>

{#if outside}
  <form id="review" data-testid="form"></form>
  <StarRating bind:value name="rating" legendText="Rating" form="review" />
{:else}
  <form data-testid="form">
    <StarRating bind:value name="rating" legendText="Rating" />
  </form>
{/if}
