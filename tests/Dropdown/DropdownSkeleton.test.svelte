<script lang="ts">
  import DropdownSkeleton from "carbon-components-svelte/Dropdown/DropdownSkeleton.svelte";
</script>

<DropdownSkeleton
  data-testid="dropdown-skeleton"
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
