<script>
  import {
    ComboBox,
    CopyInput,
    DatePicker,
    DatePickerInput,
    Dropdown,
    Meter,
    MultiSelect,
    NumberInput,
    PasswordInput,
    Select,
    SelectItem,
    Slider,
    TextArea,
    TextInput,
    TimePicker,
  } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<div style="width: 400px; display: grid; gap: 2rem;">
  <div data-testid="text-input">
    <TextInput hideLabel labelText="Name" />
  </div>
  <div data-testid="text-input-inline">
    <TextInput inline hideLabel labelText="Name" />
  </div>
  <div data-testid="password-input">
    <PasswordInput hideLabel labelText="Password" />
  </div>
  <div data-testid="password-input-inline">
    <PasswordInput inline hideLabel labelText="Password" />
  </div>
  <div data-testid="number-input">
    <NumberInput hideLabel labelText="Count" value={1} />
  </div>
  <div data-testid="select">
    <Select hideLabel labelText="Option">
      <SelectItem value="a" text="A" />
    </Select>
  </div>
  <div data-testid="select-inline">
    <Select inline hideLabel labelText="Option">
      <SelectItem value="a" text="A" />
    </Select>
  </div>
  <div data-testid="text-area">
    <TextArea hideLabel labelText="Notes" />
  </div>
  <div data-testid="combo-box">
    <ComboBox hideLabel labelText="Contact" {items} />
  </div>
  <div data-testid="dropdown">
    <Dropdown hideLabel labelText="Contact" {items} selectedId="0" />
  </div>
  <div data-testid="dropdown-inline">
    <Dropdown
      type="inline"
      hideLabel
      labelText="Contact"
      {items}
      selectedId="0"
    />
  </div>
  <div data-testid="multi-select">
    <MultiSelect hideLabel labelText="Contact" {items} />
  </div>
  <div data-testid="multi-select-inline">
    <MultiSelect type="inline" hideLabel labelText="Contact" {items} />
  </div>
  <div data-testid="time-picker">
    <TimePicker hideLabel labelText="Time" />
  </div>
  <div data-testid="date-picker">
    <DatePicker>
      <DatePickerInput hideLabel labelText="Date" />
    </DatePicker>
  </div>
  <div data-testid="copy-input">
    <CopyInput hideLabel labelText="Token" value="abc" />
  </div>
  <div data-testid="slider">
    <Slider hideLabel labelText="Volume" value={40} />
  </div>
  <div data-testid="meter">
    <Meter hideLabel labelText="Storage" value={40} />
  </div>
</div>
