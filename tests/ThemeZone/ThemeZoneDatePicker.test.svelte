<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";
  import ThemeZone from "carbon-components-svelte/ThemeZone/ThemeZone.svelte";

  export let theme: CarbonTheme = "g100";
  export let portalMenu = true;
</script>

<ThemeZone {theme}>
  <DatePicker datePickerType="single" {portalMenu}>
    <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</ThemeZone>
