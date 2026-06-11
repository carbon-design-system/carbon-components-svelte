<script lang="ts">
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";

  export let fluid = true;
</script>

<TimePicker {fluid} labelText="Time" placeholder="hh:mm">
  <svelte:fragment slot="labelChildren"> Time </svelte:fragment>
  <TimePickerSelect labelText="Clock" value="am">
    <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
</TimePicker>
