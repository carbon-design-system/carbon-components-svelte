<script lang="ts">
  import { DatePicker, DatePickerSkeleton, DatePickerInput } from "../types";
</script>

<DatePicker>
  <DatePickerInput labelText="Date of birth" placeholder="mm/dd/yyyy" />
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

<DatePicker datePickerType="single">
  <DatePickerInput labelText="Schedule a meeting" placeholder="mm/dd/yyyy" />
</DatePicker>

<DatePickerSkeleton />
