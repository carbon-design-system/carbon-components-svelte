<script>
  import {
    Box,
    Button,
    Content,
    ProgressIndicator,
    ProgressStep,
    RadioButton,
    RadioButtonGroup,
    Stack,
    Tearsheet,
    TextInput,
  } from "carbon-components-svelte";

  let open = true;
  let influencerPosition = "start";
  let influencerWidth = "narrow";
</script>

<Content>
  <Stack gap={5}>
    <RadioButtonGroup
      legendText="Influencer position"
      bind:selected={influencerPosition}
    >
      <RadioButton labelText="start" value="start" />
      <RadioButton labelText="end" value="end" />
    </RadioButtonGroup>
    <RadioButtonGroup
      legendText="Influencer width"
      bind:selected={influencerWidth}
    >
      <RadioButton labelText="narrow" value="narrow" />
      <RadioButton labelText="wide" value="wide" />
    </RadioButtonGroup>
    <Button on:click={() => (open = true)}>Create pipeline</Button>
  </Stack>
</Content>

<Tearsheet
  bind:open
  {influencerPosition}
  {influencerWidth}
  title="Create pipeline"
  description="Move data from a source to a warehouse on a schedule."
>
  <nav slot="influencer" aria-label="Steps">
    <Box padding={5}>
      <ProgressIndicator vertical currentIndex={1}>
        <ProgressStep label="Source" />
        <ProgressStep label="Mapping" />
        <ProgressStep label="Schedule" />
      </ProgressIndicator>
    </Box>
  </nav>
  <Stack gap={6}>
    <TextInput labelText="Pipeline name" placeholder="orders-daily" />
    <TextInput labelText="Target table" placeholder="analytics.orders" />
  </Stack>
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (open = false)}>Cancel</Button>
    <Button on:click={() => (open = false)}>Next</Button>
  </svelte:fragment>
</Tearsheet>
