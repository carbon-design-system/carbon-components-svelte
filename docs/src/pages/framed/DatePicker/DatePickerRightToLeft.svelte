<script>
  import {
    DatePicker,
    DatePickerInput,
    LayoutDirection,
    Stack,
  } from "carbon-components-svelte";
</script>

<LayoutDirection dir="rtl" lang="ar">
  <Stack gap={6}>
    <DatePicker datePickerType="single" locale="ar">
      <DatePickerInput labelText="تاريخ النشر" placeholder="mm/dd/yyyy" />
    </DatePicker>
    <DatePicker datePickerType="range" locale="ar">
      <DatePickerInput labelText="بداية الفترة" placeholder="mm/dd/yyyy" />
      <DatePickerInput labelText="نهاية الفترة" placeholder="mm/dd/yyyy" />
    </DatePicker>
  </Stack>
</LayoutDirection>
