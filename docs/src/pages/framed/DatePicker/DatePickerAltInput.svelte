<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let value = "";

  const flatpickrProps = {
    altInput: true,
    altFormat: "F j, Y",
    // Flatpickr creates the visible input, so it is not tied to the label.
    onReady: (_dates, _dateStr, instance) => {
      instance.altInput?.setAttribute("aria-label", "Meeting date");
    },
  };
</script>

<DatePicker
  datePickerType="single"
  dateFormat="Y-m-d"
  bind:value
  {flatpickrProps}
>
  <DatePickerInput
    labelText="Meeting date"
    placeholder="Select a date"
    helperText="Submitted value: {value || 'none'}"
  />
</DatePicker>
