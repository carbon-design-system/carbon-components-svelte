<script>
  import { Button, Select, SelectItem, Stack } from "carbon-components-svelte";

  let selected = "starter";
</script>

<Stack gap={6}>
  <Select
    labelText="Account plan"
    helperText="Selected: {selected}"
    bind:selected
  >
    <SelectItem value="free" text="Free" />
    <SelectItem value="starter" text="Starter" />
    <SelectItem value="team" text="Team" />
    <SelectItem value="business" text="Business" />
    <SelectItem value="enterprise" text="Enterprise" />
  </Select>
  <Button
    kind="tertiary"
    size="small"
    disabled={selected === "business"}
    on:click={() => (selected = "business")}
  >
    Set to "business"
  </Button>
</Stack>
