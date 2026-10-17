<script>
  import {
    ComboBox,
    DatePicker,
    DatePickerInput,
    Dropdown,
    MultiSelect,
    Select,
    SelectItem,
    TimePicker,
    TimePickerSelect,
  } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<div
  data-testid="readonly-icons"
  style="display: grid; gap: 1rem; padding: 1rem; background: var(--cds-background); width: 20rem"
>
  <div data-testid="readonly-select">
    <Select readonly labelText="Country" selected="us">
      <SelectItem value="us" text="United States" />
      <SelectItem value="ca" text="Canada" />
    </Select>
  </div>

  <div data-testid="readonly-time-picker">
    <TimePicker readonly labelText="Meeting time" value="09:30">
      <TimePickerSelect value="pm" labelText="AM/PM">
        <SelectItem value="am" text="AM" />
        <SelectItem value="pm" text="PM" />
      </TimePickerSelect>
    </TimePicker>
  </div>

  <div data-testid="readonly-dropdown">
    <Dropdown readonly labelText="Contact" selectedId="0" {items} />
  </div>

  <div data-testid="readonly-combo-box">
    <ComboBox readonly labelText="Contact" selectedId="0" {items} />
  </div>

  <div data-testid="readonly-multi-select">
    <MultiSelect
      readonly
      labelText="Contact"
      label="Contact"
      selectedIds={["0"]}
      {items}
    />
  </div>

  <div data-testid="readonly-date-picker">
    <DatePicker datePickerType="single" value="03/15/2024">
      <DatePickerInput
        labelText="Meeting date"
        placeholder="mm/dd/yyyy"
        readonly
      />
    </DatePicker>
  </div>
</div>
