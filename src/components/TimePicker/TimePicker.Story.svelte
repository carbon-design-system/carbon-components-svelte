<script>
  import Layout from '../../internal/ui/Layout.svelte';
  import { SelectItem } from '../Select';
  import TimePicker from './TimePicker.svelte';
  import TimePickerSelect from './TimePickerSelect.svelte';

  let value = '';
  let select1 = 'PM';
  let select2 = 'Time zone 1';

  $: {
    console.log(value, select1, select2);
  }
</script>

<Layout>
  <TimePicker id="time-picker" {...$$props.timepicker} bind:value>
    <TimePickerSelect {...$$props.select} id="time-picker-select-1" bind:value={select1}>
      <SelectItem value="AM" text="AM" />
      <SelectItem value="PM" text="PM" />
    </TimePickerSelect>
    <TimePickerSelect {...$$props.select} id="time-picker-select-2" bind:value={select2}>
      <SelectItem value="Time zone 1" text="Time zone 1" />
      <SelectItem value="Time zone 2" text="Time zone 2" />
    </TimePickerSelect>
  </TimePicker>
</Layout>
