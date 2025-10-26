<script lang="ts">
  import { Button, Checkbox } from "carbon-components-svelte";

  export let values = ["Apple", "Banana", "Coconut"];
  export let group = values.slice(0, 2);

  $: console.log("group changed:", group);
</script>

{#each values as value, index}
  <Checkbox
    bind:group
    labelText={value}
    {value}
    data-testid={`checkbox-${index}`}
  />
{/each}

<Button
  on:click={() => {
    group = ["Banana"];
    console.log("set to banana");
  }}
>
  Set to ["Banana"]
</Button>

<span data-testid="selected-values">{JSON.stringify(group)}</span>
