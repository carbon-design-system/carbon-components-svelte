<script lang="ts">
  import CheckboxSkeleton from "carbon-components-svelte/Checkbox/CheckboxSkeleton.svelte";
</script>

<CheckboxSkeleton
  data-testid="checkbox-skeleton"
  on:mouseover={() => {
    console.log("mouseover");
  }}
  on:mouseenter={() => {
    console.log("mouseenter");
  }}
  on:mouseleave={() => {
    console.log("mouseleave");
  }}
/>
