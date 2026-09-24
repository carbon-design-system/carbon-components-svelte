<script lang="ts">
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TimePickerSelect from "carbon-components-svelte/TimePicker/TimePickerSelect.svelte";

  export let value: number | string = "";
  export let items: { value: number | string; text: string }[] = [
    { value: "am", text: "AM" },
    { value: "pm", text: "PM" },
  ];
</script>

<TimePickerSelect bind:value labelText="Period">
  {#each items as item (item.value)}
    <SelectItem value={item.value} text={item.text} />
  {/each}
</TimePickerSelect>
<span data-testid="bound">{JSON.stringify(value)}</span>
