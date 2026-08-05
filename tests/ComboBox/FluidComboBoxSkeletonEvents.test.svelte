<script lang="ts">
  import FluidComboBoxSkeleton from "carbon-components-svelte/ComboBox/FluidComboBoxSkeleton.svelte";
</script>

<FluidComboBoxSkeleton
  data-testid="fluid-combo-box-skeleton"
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
