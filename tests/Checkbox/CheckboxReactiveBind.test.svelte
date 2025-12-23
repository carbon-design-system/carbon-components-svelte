<script lang="ts">
  import { Checkbox } from "carbon-components-svelte";

  export let checked = false;

  export function setChecked(value: boolean) {
    checked = value;
  }
</script>

<Checkbox
  bind:checked
  labelText="Reactive bind test"
  data-testid="checkbox-reactive"
  on:check={() => console.log("check")}
/>

