<script lang="ts">
  import TextAreaSkeleton from "carbon-components-svelte/TextArea/TextAreaSkeleton.svelte";
  import type { ComponentProps } from "svelte";

  export let hideLabel: ComponentProps<TextAreaSkeleton>["hideLabel"] = false;
</script>

<TextAreaSkeleton
  {hideLabel}
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
