<script>
  import {
    CopyInput,
    DatePicker,
    DatePickerInput,
    NumberInput,
    PasswordInput,
    TextArea,
    TextInput,
    TimePicker,
  } from "carbon-components-svelte";
</script>

<div style="display: grid; gap: 1rem; max-width: 24rem; padding: 1rem">
  <CopyInput
    data-testid="copy-input"
    labelText="Copy input"
    selectTextOnFocus
    value="abcdef"
  />
  <TextInput
    data-testid="text-input"
    labelText="Text input"
    selectTextOnFocus
    value="abcdef"
  />
  <PasswordInput
    data-testid="password-input"
    labelText="Password input"
    selectTextOnFocus
    value="abcdef"
  />
  <TextArea
    data-testid="text-area"
    labelText="Text area"
    selectTextOnFocus
    value="abcdef"
  />
  <TimePicker
    data-testid="time-picker"
    labelText="Time picker"
    selectTextOnFocus
    value="12:34"
  />
  <NumberInput
    data-testid="number-input"
    label="Number input"
    selectTextOnFocus
    value={123456}
  />
  <DatePicker datePickerType="single" value="01/02/2026">
    <DatePickerInput
      data-testid="date-picker-input"
      labelText="Date picker"
      placeholder="mm/dd/yyyy"
      selectTextOnFocus
    />
  </DatePicker>
</div>
