<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";

  export let obj = {
    a: false,
    b: false,
  };

  export let onChange: (obj: { a: boolean; b: boolean }) => void = () => {};

  $: onChange(obj);
</script>

<Checkbox bind:checked={obj.a} labelText="A" />
<Checkbox bind:checked={obj.b} labelText="B" />

<span data-testid="object-values">{JSON.stringify(obj)}</span>
