<script>
  import { Button, ButtonSet, Search, Stack } from "carbon-components-svelte";

  let value = "";
</script>

<Stack gap={5}>
  <Search bind:value />
  <div>
    <ButtonSet>
    <Button
      size="small"
      disabled={value === "Cloud functions"}
      on:click={() => (value = "Cloud functions")}
    >
      Set value
    </Button>
    <Button
      kind="ghost"
      size="small"
      disabled={value.length === 0}
      on:click={() => (value = "")}
    >
      Clear value
    </Button>
  </ButtonSet>
  </div>
  <div>Value: {value}</div>
</Stack>
