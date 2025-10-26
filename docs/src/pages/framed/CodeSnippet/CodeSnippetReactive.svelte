<script>
  import { Button, CodeSnippet } from "carbon-components-svelte";

  let expanded = false;
</script>

<Button on:click={() => (expanded = !expanded)}>Toggle expansion</Button>

<CodeSnippet
  type="multi"
  code={Array.from({ length: 30 }, (_, i) => i + 1).join("\n")}
  bind:expanded
  on:expand={() => {
    console.log("on:expand");
  }}
  on:collapse={() => {
    console.log("on:collapse");
  }}
/>
