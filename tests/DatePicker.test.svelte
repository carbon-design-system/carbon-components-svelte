<script lang="ts">
  import { DatePicker, DatePickerSkeleton, DatePickerInput } from "../types";
  import { Russian } from "flatpickr/dist/l10n/ru.js";
</script>

<DatePicker
  locale="{Russian}"
  datePickerType="single"
  flatpickrProps="{{ static: true }}"
  on:change
>
  <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" on:paste />
</DatePicker>

<DatePicker
  locale="az"
  on:change="{(e) => {
    console.log(e.detail);
  }}"
>
  <DatePickerInput
    labelText="Date of birth"
    helperText="Example: 01/12/1990"
    placeholder="mm/dd/yyyy"
  />
</DatePicker>

<DatePicker>
  <DatePickerInput
    hideLabel
    labelText="Date of birth"
    placeholder="mm/dd/yyyy"
  />
</DatePicker>

<DatePicker light>
  <DatePickerInput labelText="Date of birth" placeholder="mm/dd/yyyy" />
</DatePicker>

<DatePicker>
  <DatePickerInput
    size="xl"
    labelText="Date of birth"
    placeholder="mm/dd/yyyy"
  />
</DatePicker>

<DatePicker>
  <DatePickerInput
    size="sm"
    labelText="Date of birth"
    placeholder="mm/dd/yyyy"
  />
</DatePicker>

<DatePicker>
  <DatePickerInput
    invalid
    invalidText="Invalid date"
    labelText="Date of birth"
    placeholder="mm/dd/yyyy"
  />
</DatePicker>

<DatePicker>
  <DatePickerInput
    disabled
    labelText="Date of birth"
    placeholder="mm/dd/yyyy"
  />
</DatePicker>

<DatePicker valueFrom="" valueTo="" datePickerType="single">
  <DatePickerInput labelText="Schedule a meeting" placeholder="mm/dd/yyyy" />
</DatePicker>

<DatePickerSkeleton />
