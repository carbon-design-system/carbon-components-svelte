<script lang="ts">
  import {
    Box,
    Button,
    DatePicker,
    DatePickerInput,
    NumberInput,
    RadioButton,
    RadioButtonGroup,
    Select,
    SelectItem,
    Stack,
    Text,
    TextInput,
    Toggle,
  } from "carbon-components-svelte";

  let serviceName = "checkout-api";
  let region = "us-south";
  let replicas = 3;
  let plan = "standard";
  let autoScale = true;
  let backups = true;
</script>

<Box fill="layer-01" padding={7}>
  <Stack gap={6}>
    <Text tag="h3" type="productive-heading-03" color="primary">
      Provision a service
    </Text>
    <div class="form-grid">
      <TextInput
        labelText="Service name"
        placeholder="my-service"
        bind:value={serviceName}
      />
      <Select labelText="Region" bind:selected={region}>
        <SelectItem value="us-south" text="Dallas (us-south)" />
        <SelectItem value="eu-de" text="Frankfurt (eu-de)" />
        <SelectItem value="jp-tok" text="Tokyo (jp-tok)" />
        <SelectItem value="us-east" text="Washington (us-east)" />
      </Select>
      <NumberInput
        labelText="Replicas"
        min={1}
        max={10}
        bind:value={replicas}
        helperText="Between 1 and 10"
      />
      <DatePicker
        datePickerType="single"
        value="06/20/2026"
        flatpickrProps={{ static: false }}
      >
        <DatePickerInput labelText="Launch date" placeholder="mm/dd/yyyy" />
      </DatePicker>
      <RadioButtonGroup legendText="Plan" bind:selected={plan}>
        <RadioButton labelText="Lite" value="lite" />
        <RadioButton labelText="Standard" value="standard" />
        <RadioButton labelText="Premium" value="premium" />
      </RadioButtonGroup>
      <Stack gap={5}>
        <Toggle labelText="Auto-scaling" bind:toggled={autoScale} />
        <Toggle labelText="Daily backups" bind:toggled={backups} />
      </Stack>
    </div>
    <Stack orientation="horizontal" gap={3}>
      <Button>Create service</Button>
      <Button kind="ghost">Cancel</Button>
    </Stack>
  </Stack>
</Box>

<style>
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--cds-spacing-05) var(--cds-spacing-06);
  }

  @media (max-width: 672px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
