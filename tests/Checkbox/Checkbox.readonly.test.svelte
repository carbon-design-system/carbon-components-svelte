<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import type { ComponentProps } from "svelte";

  export let checked = false;
  export let readonly = false;
  export let decorative = false;
  export let id: ComponentProps<Checkbox>["id"] = undefined;
  export let readonlyText: ComponentProps<Checkbox>["readonlyText"] = undefined;
</script>

<Checkbox
  bind:checked
  {readonly}
  {decorative}
  {id}
  {readonlyText}
  labelText="Readonly checkbox test"
  data-testid="checkbox"
  on:change={() => console.log("change")}
/>
