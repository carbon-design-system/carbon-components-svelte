<script>
  import { Button, Select, SelectItem } from "carbon-components-svelte";

  let selected = "g10";
</script>

<Select labelText="Carbon theme" bind:selected>
  <SelectItem value="white" text="White" />
  <SelectItem value="g10" text="Gray 10" />
  <SelectItem value="g80" text="Gray 80" />
  <SelectItem value="g90" text="Gray 90" />
  <SelectItem value="g100" text="Gray 100" />
</Select>

<div style="margin: var(--cds-layout-01) 0">
  Selected: <strong>{selected}</strong>
</div>

<Button disabled={selected === "g90"} on:click={() => (selected = "g90")}>
  Set to "g90"
</Button>
