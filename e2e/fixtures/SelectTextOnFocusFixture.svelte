<script>
  import {
    CopyInput,
    DatePicker,
    DatePickerInput,
    NumberInput,
    PasswordInput,
    RangeSlider,
    Search,
    SearchMenu,
    Slider,
    TextArea,
    TextInput,
    TimePicker,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
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

  <Search
    data-testid="search"
    labelText="Search"
    selectTextOnFocus
    value="abcdef"
  />
  <SearchMenu
    data-testid="search-menu"
    labelText="Search menu"
    selectTextOnFocus
    value="abcdef"
    items={["abcdef"]}
  />
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        data-testid="toolbar-search"
        persistent
        selectTextOnFocus
        value="abcdef"
      />
    </ToolbarContent>
  </Toolbar>
  <Slider
    data-testid="slider"
    labelText="Slider"
    selectTextOnFocus
    max={999999}
    value={123456}
  />
  <RangeSlider
    data-testid="range-slider"
    labelText="Range slider"
    selectTextOnFocus
    max={999999}
    value={123456}
    valueUpper={234567}
  />
</div>
