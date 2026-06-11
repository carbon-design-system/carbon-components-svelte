<script lang="ts">
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";
</script>

<FluidForm>
  <TimePicker labelText="Time" placeholder="hh:mm">
    <TimePickerSelect labelText="Clock" value="am">
      <SelectItem value="am" text="AM" />
      <SelectItem value="pm" text="PM" />
    </TimePickerSelect>
  </TimePicker>
</FluidForm>
