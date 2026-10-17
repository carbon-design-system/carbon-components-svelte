<script>
  import {
    SelectItem,
    TimePicker,
    TimePickerSelect,
  } from "carbon-components-svelte";
</script>

<div style="width: 400px; display: grid; gap: 1rem;">
  <div data-testid="one-select">
    <TimePicker fluid labelText="Time" value="09:30">
      <TimePickerSelect value="am" labelText="AM or PM">
        <SelectItem value="am" text="AM" />
      </TimePickerSelect>
    </TimePicker>
  </div>
  <div data-testid="two-selects">
    <TimePicker fluid labelText="Time" value="09:30">
      <TimePickerSelect value="am" labelText="AM or PM">
        <SelectItem value="am" text="AM" />
      </TimePickerSelect>
      <TimePickerSelect value="utc" labelText="Time zone">
        <SelectItem value="utc" text="UTC" />
      </TimePickerSelect>
    </TimePicker>
  </div>
  {#each [
    { id: "invalid", invalid: true },
    { id: "warning", warn: true },
  ] as status (status.id)}
    <div data-testid={status.id}>
      <TimePicker
        fluid
        labelText="Time"
        value="09:30"
        invalid={status.invalid}
        invalidText="Invalid time"
        warn={status.warn}
        warnText="Check the time"
      >
        <TimePickerSelect value="am" labelText="AM or PM">
          <SelectItem value="am" text="AM" />
        </TimePickerSelect>
        <TimePickerSelect value="utc" labelText="Time zone">
          <SelectItem value="utc" text="UTC" />
        </TimePickerSelect>
      </TimePicker>
    </div>
  {/each}
</div>
