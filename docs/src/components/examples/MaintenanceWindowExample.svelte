<script lang="ts">
  import {
    Box,
    Button,
    DatePicker,
    DatePickerInput,
    FluidForm,
    Select,
    SelectItem,
    Slider,
    Stack,
    Text,
    TextInput,
  } from "carbon-components-svelte";

  let maintenanceService = "checkout-api";
  let timezone = "utc";
  let noticeHours = 24;
</script>

<Box fill="layer-01" padding={7}>
  <Stack gap={6}>
    <Text tag="h3" type="productive-heading-03" color="primary">
      Schedule a maintenance window
    </Text>
    <FluidForm>
      <TextInput labelText="Window name" value="Q3 database upgrade" />
      <Select labelText="Affected service" bind:selected={maintenanceService}>
        <SelectItem value="checkout-api" text="checkout-api" />
        <SelectItem value="payments-gateway" text="payments-gateway" />
        <SelectItem value="search-indexer" text="search-indexer" />
      </Select>
      <Select labelText="Timezone" bind:selected={timezone}>
        <SelectItem value="utc" text="UTC" />
        <SelectItem value="us-central" text="US Central" />
        <SelectItem value="eu-central" text="Europe Central" />
      </Select>
    </FluidForm>
    <DatePicker
      datePickerType="range"
      valueFrom="06/20/2026"
      valueTo="06/22/2026"
      flatpickrProps={{ static: false }}
    >
      <DatePickerInput labelText="Window start" placeholder="mm/dd/yyyy" />
      <DatePickerInput labelText="Window end" placeholder="mm/dd/yyyy" />
    </DatePicker>
    <Slider
      labelText="Notify users in advance (hours)"
      min={0}
      max={72}
      step={1}
      bind:value={noticeHours}
      fullWidth
    />
    <Button>Schedule window</Button>
  </Stack>
</Box>
