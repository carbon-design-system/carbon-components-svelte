<script lang="ts">
  import { Checkbox } from "carbon-components-svelte";

  export let group = ["option-2"];

  const checkCounts = {
    "option-1": 0,
    "option-2": 0,
    "option-3": 0,
  };

  function handleCheck(value: string, event: CustomEvent<boolean>) {
    checkCounts[value as keyof typeof checkCounts]++;
    console.log(
      "check",
      value,
      event.detail,
      checkCounts[value as keyof typeof checkCounts],
    );
  }
</script>

<Checkbox
  bind:group
  value="option-1"
  labelText="Option 1"
  data-testid="checkbox-1"
  on:check={(e) => handleCheck("option-1", e)}
/>

<Checkbox
  bind:group
  value="option-2"
  labelText="Option 2"
  data-testid="checkbox-2"
  on:check={(e) => handleCheck("option-2", e)}
/>

<Checkbox
  bind:group
  value="option-3"
  labelText="Option 3"
  data-testid="checkbox-3"
  on:check={(e) => handleCheck("option-3", e)}
/>

<div data-testid="check-counts">
  {JSON.stringify(checkCounts)}
</div>

