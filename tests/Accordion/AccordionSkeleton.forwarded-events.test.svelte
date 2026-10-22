<script lang="ts">
  import AccordionSkeleton from "carbon-components-svelte/Accordion/AccordionSkeleton.svelte";
</script>

<AccordionSkeleton
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
