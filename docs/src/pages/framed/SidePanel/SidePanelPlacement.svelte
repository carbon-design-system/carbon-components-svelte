<script>
  import {
    Button,
    Content,
    Header,
    RadioButton,
    RadioButtonGroup,
    SidePanel,
    Stack,
  } from "carbon-components-svelte";

  let open = true;
  let placement = "start";
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Stack gap={5}>
    <RadioButtonGroup legendText="Placement" bind:selected={placement}>
      <RadioButton labelText="Start" value="start" />
      <RadioButton labelText="End" value="end" />
    </RadioButtonGroup>
    <Button on:click={() => (open = true)}>Filter services</Button>
  </Stack>
</Content>

<SidePanel bind:open {placement} size="sm" title="Filters">
  <p>Show services by runtime, region and plan.</p>
</SidePanel>
