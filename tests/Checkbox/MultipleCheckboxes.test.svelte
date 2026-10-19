<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";

  export let values = ["Apple", "Banana", "Coconut"];
  export let group = values.slice(0, 2);
  export let onChange: (group: string[]) => void = () => {};
  export let onSet: () => void = () => {};

  $: onChange(group);
</script>

{#each values as value}
  <Checkbox bind:group labelText={value} {value} />
{/each}

<Button
  on:click={() => {
    group = ["Banana"];
    onSet();
  }}
>
  Set to ["Banana"]
</Button>

<span data-testid="selected-values">{JSON.stringify(group)}</span>
