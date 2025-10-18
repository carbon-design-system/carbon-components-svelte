<script lang="ts">
  import { Checkbox } from "carbon-components-svelte";

  export let checked = false;
  export let readonly = false;
</script>

<Checkbox
  bind:checked
  {readonly}
  labelText="Readonly checkbox test"
  data-testid="checkbox"
/>
