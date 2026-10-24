<script lang="ts">
  import CodeSnippetSkeleton from "carbon-components-svelte/CodeSnippet/CodeSnippetSkeleton.svelte";

  export let type: "single" | "multi" = "single";
</script>

<CodeSnippetSkeleton
  {type}
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
