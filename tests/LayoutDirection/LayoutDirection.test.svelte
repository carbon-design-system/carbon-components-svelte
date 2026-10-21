<script lang="ts">
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import FloatingPortal from "carbon-components-svelte/Portal/FloatingPortal.svelte";
  import Portal from "carbon-components-svelte/Portal/Portal.svelte";
  import ThemeZone from "carbon-components-svelte/ThemeZone/ThemeZone.svelte";
  import DirectionProbe from "./DirectionProbe.test.svelte";

  export let dir: "ltr" | "rtl" = "rtl";
  export let innerDir: "ltr" | "rtl" = "ltr";
  export let tag: keyof HTMLElementTagNameMap = "div";
  export let datePicker = false;
  export let portalMenu = true;
</script>

<DirectionProbe testId="probe-outside" />
<FloatingPortal anchor={null} open data-testid="portal-outside"
  >Outside</FloatingPortal
>
<Portal data-testid="bare-outside">Bare outside</Portal>

<LayoutDirection {dir} {tag} class="custom" data-testid="outer">
  <DirectionProbe testId="probe-outer" />
  <Portal data-testid="bare-outer" class="custom-portal">Bare in outer</Portal>
  <Portal data-testid="bare-override" dir="ltr">Bare own dir</Portal>
  <FloatingPortal anchor={null} open data-testid="portal-outer"
    >In outer</FloatingPortal
  >
  <FloatingPortal anchor={null} open data-testid="portal-override" dir="ltr"
    >Own dir</FloatingPortal
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
    <DatePicker datePickerType="single" {portalMenu}>
      <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
    </DatePicker>
  {/if}
  <ThemeZone theme="g100">
    <Portal data-testid="zone-in-direction">Zone in direction</Portal>
  </ThemeZone>
  <LayoutDirection dir={innerDir} data-testid="inner">
    <DirectionProbe testId="probe-inner" />
    <FloatingPortal anchor={null} open data-testid="portal-inner"
      >In inner</FloatingPortal
    >
  </LayoutDirection>
</LayoutDirection>

<ThemeZone theme="g10">
  <LayoutDirection dir="rtl">
    <Portal data-testid="direction-in-zone">Direction in zone</Portal>
  </LayoutDirection>
</ThemeZone>
