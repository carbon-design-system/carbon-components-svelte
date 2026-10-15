<script lang="ts">
  import StarRating from "carbon-components-svelte/StarRating/StarRating.svelte";

  const words = ["Poor", "Fair", "Good", "Very good", "Excellent"];

  export let readonly = false;
  export let value = 2;
</script>

<StarRating legendText="Overall rating" {readonly} {value} let:value={shown}>
  {words[shown - 1] ?? "Not rated"}
</StarRating>
