<script>
  import {
    SelectItem,
    TimePicker,
    TimePickerSelect,
  } from "carbon-components-svelte";

  let value = "";
</script>

<TimePicker data-testid="time-picker" labelText="Meeting time" bind:value>
  <TimePickerSelect value="pm" labelText="AM/PM">
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
</TimePicker>

<!-- An invalid picker with two selects, in containers of two widths. -->
{#each [200, 400] as width (width)}
  <div data-testid="time-picker-{width}" style="width: {width}px">
    <TimePicker
      labelText="Starts at {width}"
      value="09:30"
      invalid
      invalidText="Invalid time"
    >
      <TimePickerSelect value="am" labelText="Period at {width}">
        <SelectItem value="am" text="AM" />
      </TimePickerSelect>
      <TimePickerSelect value="utc" labelText="Zone at {width}">
        <SelectItem value="utc" text="UTC" />
      </TimePickerSelect>
    </TimePicker>
  </div>
{/each}
