<script>
  import {
    Checkbox,
    DatePicker,
    DatePickerInput,
    Slider,
    TextInput,
    TimePicker,
    Toggle,
  } from "carbon-components-svelte";
</script>

<!-- Each row is 600px wide; the marker shows where the next item starts. -->
<div class="row" data-testid="row-toggle">
  <Toggle
    size="sm"
    labelText="Live prices"
    hideLabel
    labelA="Paused"
    labelB="Live"
  />
  <span data-marker>Updated 2 min ago</span>
</div>

<div class="row" data-testid="row-checkbox">
  <Checkbox labelText="Signature required" />
  <span data-marker>Adds $2</span>
</div>

<div class="row" data-testid="row-time-picker">
  <TimePicker labelText="From" value="10:00" />
  <span data-marker>to 7:00 AM</span>
</div>

<div class="row" data-testid="row-date-picker">
  <DatePicker datePickerType="single">
    <DatePickerInput labelText="Due date" placeholder="mm/dd/yyyy" />
  </DatePicker>
  <span data-marker>Net 30</span>
</div>

<div class="row" data-testid="row-slider">
  <Slider labelText="Volume" value={40} />
  <span data-marker>40%</span>
</div>

<div class="row" data-testid="row-text-input">
  <TextInput labelText="Role name" />
  <span data-marker>Required</span>
</div>

<div class="row" data-testid="row-slider-full-width">
  <Slider fullWidth labelText="Rollout" value={35} />
  <span data-marker>35%</span>
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 600px;
    margin-bottom: 32px;
  }
</style>
