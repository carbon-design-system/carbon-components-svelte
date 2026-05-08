<script lang="ts">
  import { DatePickerSkeleton } from "carbon-components-svelte";
</script>

<DatePickerSkeleton
  data-testid="date-picker-skeleton"
  {...$$props}
  on:click={() => {
    console.log("click");
  }}
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
