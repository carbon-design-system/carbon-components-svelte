<script>
  import {
    Button,
    Checkbox,
    DatePicker,
    DatePickerInput,
    NumberInput,
    Search,
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

<!-- Narrow rows: fields shrink to fit beside their neighbours. -->
<div class="narrow" data-testid="narrow-text-input">
  <TextInput labelText="Code" hideLabel placeholder="WELCOME10" />
  <Button size="field">Apply</Button>
</div>

<div class="narrow" data-testid="narrow-search">
  <Search placeholder="Search contacts" />
  <Button size="field">Add</Button>
</div>

<div class="narrow-grid" data-testid="narrow-number-input">
  <NumberInput labelText="Min" hideLabel hideSteppers value={1} />
  <NumberInput labelText="Max" hideLabel hideSteppers value={9} />
</div>

<style>
  .narrow {
    display: flex;
    gap: 8px;
    width: 200px;
    margin-bottom: 32px;
  }

  .narrow-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 8px;
    width: 200px;
    margin-bottom: 32px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 600px;
    margin-bottom: 32px;
  }
</style>
