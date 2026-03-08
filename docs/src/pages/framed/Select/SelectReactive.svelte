<script>
  import { Button, Select, SelectItem, Stack } from "carbon-components-svelte";

  let selected = "g10";
</script>

<Stack gap={6}>
  <Select
    labelText="Carbon theme"
    helperText="Selected: {selected}"
    bind:selected
  >
    <SelectItem value="white" text="White" />
    <SelectItem value="g10" text="Gray 10" />
    <SelectItem value="g80" text="Gray 80" />
    <SelectItem value="g90" text="Gray 90" />
    <SelectItem value="g100" text="Gray 100" />
  </Select>
  <Button
    kind="tertiary"
    size="small"
    disabled={selected === "g90"}
    on:click={() => (selected = "g90")}
  >
    Set to "g90"
  </Button>
</Stack>
