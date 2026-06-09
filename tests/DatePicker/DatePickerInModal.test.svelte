<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import type { ComponentProps } from "svelte";

  export let modalOpen = true;
  export let portalMenu: ComponentProps<DatePicker>["portalMenu"] = undefined;
</script>

<Modal
  bind:open={modalOpen}
  modalHeading="Test"
  primaryButtonText="OK"
  secondaryButtonText="Cancel"
>
  <DatePicker datePickerType="single" {portalMenu}>
    <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</Modal>
