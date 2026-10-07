<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
  import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import TextInputSkeleton from "carbon-components-svelte/TextInput/TextInputSkeleton.svelte";
  import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<Form>["size"] = undefined;

  const items = [{ id: "us-east-1", text: "US East" }];
</script>

<Form {size} data-testid="form">
  <TextInput labelText="Workspace" />
  <TextInput labelText="Override" size="xl" />
  <PasswordInput labelText="Password" />
  <NumberInput labelText="Clusters" value={1} />
  <Select labelText="Plan">
    <SelectItem value="team" text="Team" />
  </Select>
  <DatePicker>
    <DatePickerInput labelText="Start date" />
  </DatePicker>
  <TimePicker labelText="Start time" />
  <CopyInput labelText="Token" value="sk-123" />
  <Dropdown labelText="Region" selectedId="us-east-1" {items} />
  <ComboBox labelText="Region search" {items} />
  <MultiSelect labelText="Regions" label="Choose" {items} />
  <Search labelText="Search logs" />
  <PinCodeInput labelText="Code" />
  <TextInputSkeleton data-testid="skeleton" />
</Form>
