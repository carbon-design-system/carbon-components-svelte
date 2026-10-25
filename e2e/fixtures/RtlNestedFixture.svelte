<script>
  import {
    DatePicker,
    DatePickerInput,
    PasswordInput,
    Search,
    Select,
    SelectItem,
  } from "carbon-components-svelte";
</script>

<!-- The test sets the page's `dir` on <html>; each region sets its own. -->
{#each ["ltr", "rtl"] as dir (dir)}
  <div data-testid="region-{dir}" {dir} style="width: 20rem">
    <div data-field="password">
      <PasswordInput
        labelText="API key"
        value="sk-live-4f2a9c"
        invalid
        invalidText="The key has expired."
      />
    </div>
    <div data-field="select">
      <Select labelText="Region" invalid invalidText="Pick a region.">
        <SelectItem value="us-east-1" text="US East (N. Virginia)" />
      </Select>
    </div>
    <div data-field="date-picker">
      <DatePicker datePickerType="single">
        <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
      </DatePicker>
    </div>
    <div data-field="search">
      <Search labelText="Search services" value="payments" />
    </div>
  </div>
{/each}
