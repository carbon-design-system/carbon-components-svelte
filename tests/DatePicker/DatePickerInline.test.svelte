<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";

  export let inline = true;
  export let portalMenu: boolean | undefined = undefined;
  export let onevent: (name: string) => void = () => {};

  let value = "03/15/2024";
</script>

<DatePicker
  datePickerType="single"
  {inline}
  {portalMenu}
  bind:value
  on:open={() => onevent("open")}
  on:close={() => onevent("close")}
  on:change={() => onevent("change")}
>
  <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
</DatePicker>

<button type="button">Elsewhere</button>
<p data-testid="value">{value}</p>
