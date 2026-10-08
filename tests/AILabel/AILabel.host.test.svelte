<script lang="ts">
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";

  export let revertActive = false;
  export let showLabel = true;

  const items = [{ id: "us-east-1", text: "US East" }];
</script>

<div data-testid="text-input">
  <TextInput labelText="Summary" size="xs">
    <svelte:fragment slot="decorator">
      {#if showLabel}
        <AILabel size="xl" bind:revertActive />
      {/if}
    </svelte:fragment>
  </TextInput>
</div>
<div data-testid="text-area">
  <TextArea labelText="Notes"><AILabel slot="decorator" /></TextArea>
</div>
<div data-testid="number-input">
  <NumberInput labelText="Replicas" value={1}>
    <AILabel slot="decorator" />
  </NumberInput>
</div>
<div data-testid="select">
  <Select labelText="Plan">
    <SelectItem value="team" text="Team" />
    <AILabel slot="decorator" />
  </Select>
</div>
<div data-testid="date-picker">
  <DatePicker>
    <DatePickerInput labelText="Start"
      ><AILabel slot="decorator" /></DatePickerInput
    >
  </DatePicker>
</div>
<div data-testid="dropdown">
  <Dropdown labelText="Region" {items}><AILabel slot="decorator" /></Dropdown>
</div>
<div data-testid="combo-box">
  <ComboBox labelText="Region search" {items}>
    <AILabel slot="decorator" />
  </ComboBox>
</div>
<div data-testid="multi-select">
  <MultiSelect labelText="Regions" {items}
    ><AILabel slot="decorator" /></MultiSelect
  >
</div>
<div data-testid="plain">
  <TextInput labelText="Plain" />
</div>
