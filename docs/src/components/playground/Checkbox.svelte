<script>
  import { Checkbox } from "carbon-components-svelte";

  export let value = undefined;
</script>

<Checkbox bind:checked="{value}" {...$$restProps} />
