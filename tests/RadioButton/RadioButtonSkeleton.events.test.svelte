<script lang="ts">
  import RadioButtonSkeleton from "carbon-components-svelte/RadioButton/RadioButtonSkeleton.svelte";
</script>

<RadioButtonSkeleton
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
