<script lang="ts">
  import ButtonSkeleton from "carbon-components-svelte/Button/ButtonSkeleton.svelte";
</script>

<ButtonSkeleton
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
