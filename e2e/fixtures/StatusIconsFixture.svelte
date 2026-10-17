<script>
  import {
    ComboBox,
    DatePicker,
    DatePickerInput,
    Dropdown,
    MultiSelect,
    NumberInput,
    PasswordInput,
    PinCodeInput,
    Search,
    Select,
    SelectItem,
    TagInput,
    TextInput,
    TimePicker,
    TimePickerSelect,
  } from "carbon-components-svelte";

  // Every field with a value (so clear buttons, steppers and tags show),
  // in each status, at three sizes and fluid.
  const items = [
    { id: "eu", text: "EU Germany" },
    { id: "us", text: "US East" },
  ];
  const variants = [
    { key: "xs", size: "xs", fluid: false },
    { key: "md", size: undefined, fluid: false },
    { key: "xl", size: "xl", fluid: false },
    { key: "fluid", size: undefined, fluid: true },
  ];
  const statuses = [
    { key: "invalid", props: { invalid: true, invalidText: "Fix this value" } },
    { key: "warn", props: { warn: true, warnText: "Check this value" } },
  ];
</script>

<div
  style="display: grid; grid-template-columns: repeat(4, 300px); gap: 1.5rem;"
>
  {#each statuses as status}
    {#each variants as v}
      {@const p = { size: v.size, fluid: v.fluid, ...status.props }}
      <div data-cell="TextInput {v.key} {status.key}">
        <TextInput {...p} labelText="Name" value="billing" />
      </div>
      <div data-cell="PasswordInput {v.key} {status.key}">
        <PasswordInput {...p} labelText="Password" value="secret" />
      </div>
      <div data-cell="NumberInput {v.key} {status.key}">
        <NumberInput {...p} labelText="Count" value={3} />
      </div>
      <div data-cell="Select {v.key} {status.key}">
        <Select {...p} labelText="Region"
          ><SelectItem value="eu" text="EU" /></Select
        >
      </div>
      <div data-cell="Dropdown {v.key} {status.key}">
        <Dropdown {...p} labelText="Region" {items} selectedId="eu" />
      </div>
      <div data-cell="ComboBox {v.key} {status.key}">
        <ComboBox {...p} labelText="Region" {items} selectedId="eu" />
      </div>
      <div data-cell="MultiSelect {v.key} {status.key}">
        <MultiSelect {...p} labelText="Regions" {items} selectedIds={["eu"]} />
      </div>
      <div data-cell="TimePicker {v.key} {status.key}">
        <TimePicker {...p} labelText="Time" value="09:30">
          <TimePickerSelect value="am" labelText="AM or PM">
            <SelectItem value="am" text="AM" />
          </TimePickerSelect>
        </TimePicker>
      </div>
      <div data-cell="Search {v.key} {status.key}">
        <Search {...p} labelText="Search" value="billing" />
      </div>
      <div data-cell="DatePicker {v.key} {status.key}">
        <DatePicker datePickerType="single" fluid={v.fluid}>
          <DatePickerInput
            {...status.props}
            size={v.size}
            labelText="Date"
            value="10/15/2026"
          />
        </DatePicker>
      </div>
      <div data-cell="PinCodeInput {v.key} {status.key}">
        <PinCodeInput {...p} labelText="Code" value="1234" />
      </div>
      {#if !v.fluid}
        <div data-cell="TagInput {v.key} {status.key}">
          <TagInput
            {...status.props}
            size={v.size}
            labelText="Topics"
            value={["api"]}
          />
        </div>
      {/if}
    {/each}
  {/each}
</div>
