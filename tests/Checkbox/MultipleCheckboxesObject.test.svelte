<script lang="ts">
  import { Checkbox } from "carbon-components-svelte";

  export let obj = {
    a: false,
    b: false,
  };

  $: console.log("object changed:", obj);
</script>

<Checkbox bind:checked={obj.a} labelText="A" data-testid="checkbox-a" />
<Checkbox bind:checked={obj.b} labelText="B" data-testid="checkbox-b" />

<span data-testid="object-values">{JSON.stringify(obj)}</span>
