<script>
  import {
    ComboBox,
    DatePicker,
    DatePickerInput,
    MultiSelect,
    NumberInput,
    PinCodeInput,
    Search,
    Select,
    SelectItem,
    TextArea,
    TextInput,
    TimePicker,
    Toggletip,
  } from "carbon-components-svelte";

  const label = "Billing contact for overdue invoices";
  const items = [{ id: "a", text: "Alpha" }];
</script>

<!-- Fluid fields too narrow for their labels. -->
<div
  style="width: 160px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem;"
>
  <button type="button" data-testid="start">Start</button>
  <div data-testid="text-input"><TextInput fluid labelText={label} /></div>
  <div data-testid="text-area"><TextArea fluid labelText={label} /></div>
  <div data-testid="select">
    <Select fluid labelText={label}
      ><SelectItem value="a" text="Alpha" /></Select
    >
  </div>
  <div data-testid="number-input">
    <NumberInput fluid labelText={label} value={1} />
  </div>
  <div data-testid="combo-box">
    <ComboBox fluid labelText={label} {items} />
  </div>
  <div data-testid="multi-select">
    <MultiSelect fluid labelText={label} {items} />
  </div>
  <div data-testid="date-picker">
    <DatePicker fluid datePickerType="single">
      <DatePickerInput labelText={label} placeholder="mm/dd/yyyy" />
    </DatePicker>
  </div>
  <div data-testid="time-picker"><TimePicker fluid labelText={label} /></div>
  <div data-testid="search"><Search fluid labelText={label} /></div>
  <div data-testid="pin-code-input">
    <PinCodeInput fluid labelText={label} count={2} />
  </div>
  <div data-testid="hidden-label">
    <TextInput fluid hideLabel labelText={label} />
  </div>
  <div data-testid="slotted-label">
    <TextInput fluid>
      <svelte:fragment slot="labelChildren">
        {label}
        <Toggletip iconDescription="About billing contacts">
          The person who receives overdue notices.
        </Toggletip>
      </svelte:fragment>
    </TextInput>
  </div>
</div>

<!-- The same fields wide enough for their labels. -->
<div
  data-testid="wide"
  style="width: 480px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; margin-top: 2rem;"
>
  <TextInput fluid labelText={label} />
  <TextArea fluid labelText={label} />
  <Select fluid labelText={label}><SelectItem value="a" text="Alpha" /></Select>
  <NumberInput fluid labelText={label} value={1} />
  <ComboBox fluid labelText={label} {items} />
  <MultiSelect fluid labelText={label} {items} />
  <DatePicker fluid datePickerType="single">
    <DatePickerInput labelText={label} placeholder="mm/dd/yyyy" />
  </DatePicker>
  <TimePicker fluid labelText={label} />
  <Search fluid labelText={label} />
  <PinCodeInput fluid labelText={label} count={6} />
</div>
