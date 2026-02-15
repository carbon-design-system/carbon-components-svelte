<script lang="ts">
  import { DatePicker, DatePickerInput, Modal } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let modalOpen = true;
  export let portalMenu: ComponentProps<DatePicker>["portalMenu"] = undefined;
</script>

<Modal bind:open={modalOpen} modalHeading="Test" primaryButtonText="OK" secondaryButtonText="Cancel">
  <DatePicker datePickerType="single" {portalMenu}>
    <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</Modal>
