<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
  import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";
  import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";
  import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
  import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";
  import type { ComponentType } from "svelte";

  export let kind = "TextInput";
  export let props: Record<string, unknown> = {};

  const items = [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
  ];
  const simple: Record<string, ComponentType> = {
    TextInput,
    PasswordInput,
    TextArea,
    NumberInput,
    Search,
    CopyInput,
    PinCodeInput,
    TimePicker,
    Toggle,
    Checkbox,
    Slider,
    RangeSlider,
  };
  const listbox: Record<string, ComponentType> = {
    ComboBox,
    Dropdown,
    MultiSelect,
  };
</script>

{#if simple[kind]}
  <svelte:component this={simple[kind]} labelText="LBL" {...props} />
{:else if listbox[kind]}
  <svelte:component this={listbox[kind]} labelText="LBL" {items} {...props} />
{:else if kind === "Select"}
  <Select labelText="LBL" {...props}>
    <SelectItem value="a" text="Alpha" />
    <SelectItem value="b" text="Beta" />
  </Select>
{:else if kind === "DatePicker"}
  <DatePicker datePickerType="single">
    <DatePickerInput labelText="LBL" {...props} />
  </DatePicker>
{:else if kind === "CheckboxGroup"}
  <CheckboxGroup legendText="LBL" {...props}>
    <Checkbox value="a" labelText="Alpha" />
    <Checkbox value="b" labelText="Beta" />
  </CheckboxGroup>
{:else if kind === "RadioButtonGroup"}
  <RadioButtonGroup legendText="LBL" {...props}>
    <RadioButton value="a" labelText="Alpha" />
    <RadioButton value="b" labelText="Beta" />
  </RadioButtonGroup>
{/if}
