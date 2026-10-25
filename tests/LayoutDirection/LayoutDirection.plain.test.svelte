<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import FloatingPortal from "carbon-components-svelte/Portal/FloatingPortal.svelte";
  import Portal from "carbon-components-svelte/Portal/Portal.svelte";

  export let dir: "ltr" | "rtl" = "rtl";
  export let plainDir: "ltr" | "rtl" = "ltr";
  export let datePicker = false;
</script>

<!-- A plain `dir` inside a LayoutDirection, and one outside any. -->
<LayoutDirection {dir}>
  <div dir={plainDir}>
    <Portal data-testid="bare-plain">Bare</Portal>
    <FloatingPortal anchor={null} open data-testid="floating-plain"
      >Floating</FloatingPortal
    >
    <Dropdown
      open
      portalMenu
      labelText="Region"
      selectedId="0"
      items={[
        { id: "0", text: "us-east-1" },
        { id: "1", text: "eu-west-1" },
      ]}
    />
    {#if datePicker}
      <DatePicker datePickerType="single" portalMenu>
        <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
      </DatePicker>
    {/if}
  </div>
</LayoutDirection>

<div dir="rtl">
  <Portal data-testid="bare-no-context">No context</Portal>
</div>
