<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<!-- Pickers in boxes narrower than their fixed widths. -->
{#each [200, 260] as width}
  <div data-testid="single-{width}" style="width: {width}px; margin: 1rem;">
    <DatePicker datePickerType="single">
      <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
    </DatePicker>
  </div>
  <div data-testid="range-{width}" style="width: {width}px; margin: 1rem;">
    <DatePicker datePickerType="range">
      <DatePickerInput labelText="From" placeholder="mm/dd/yyyy" />
      <DatePickerInput labelText="To" placeholder="mm/dd/yyyy" />
    </DatePicker>
  </div>
{/each}
<div data-testid="single-wide" style="width: 600px; margin: 1rem;">
  <DatePicker datePickerType="single">
    <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</div>
