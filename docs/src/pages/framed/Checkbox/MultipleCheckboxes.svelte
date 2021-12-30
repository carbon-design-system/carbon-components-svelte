<script>
  import { Checkbox } from "carbon-components-svelte";

  let options = ["Apple", "Banana", "Coconut"];
  let selection = options.slice(0, 2);
</script>

{#each options as option}
  <Checkbox bind:group="{selection}" labelText="{option}" value="{option}" />
{/each}

<div style="margin: var(--cds-layout-01) 0">
  Selected options:
  <strong>{selection.join(", ")}</strong>
</div>
