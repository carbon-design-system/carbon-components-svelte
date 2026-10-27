<script lang="ts">
  import ComboButton from "carbon-components-svelte/ComboButton/ComboButton.svelte";
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import InputGroup from "carbon-components-svelte/InputGroup/InputGroup.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import MenuButton from "carbon-components-svelte/MenuButton/MenuButton.svelte";
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import ToggleButton from "carbon-components-svelte/ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "carbon-components-svelte/ToggleButtonGroup/ToggleButtonGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<InputGroup>["size"] = undefined;
</script>

<InputGroup {size}>
  <Search labelText="Search" />
  <ContentSwitcher data-testid="switcher">
    <Switch text="Grid" />
    <Switch text="List" />
  </ContentSwitcher>
  <OverflowMenu iconDescription="More"
    ><OverflowMenuItem text="Export" /></OverflowMenu
  >
  <MenuButton labelText="Actions"><MenuItem labelText="Export" /></MenuButton>
  <ComboButton labelText="Save"><MenuItem labelText="Save as" /></ComboButton>
  <ToggleButtonGroup labelText="View" data-testid="toggles">
    <ToggleButton value="grid">Grid</ToggleButton>
  </ToggleButtonGroup>
  <DatePicker datePickerType="single" data-testid="date-picker">
    <DatePickerInput hideLabel labelText="Date" />
  </DatePicker>
</InputGroup>

<ContentSwitcher data-testid="alone">
  <Switch text="Grid" />
  <Switch text="List" />
</ContentSwitcher>
