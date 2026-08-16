<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import Popover from "carbon-components-svelte/Popover/Popover.svelte";

  export let open = true;
  export let closeOnOutsideClick = true;
  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
</script>

<Popover bind:open {closeOnOutsideClick} on:close={onClose}>
  <DatePicker datePickerType="single" portalMenu={true}>
    <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</Popover>
