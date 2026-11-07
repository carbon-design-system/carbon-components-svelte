<script>
  import {
    Button,
    Checkbox,
    CheckboxGroup,
    collectFormErrors,
    ComboBox,
    DatePicker,
    DatePickerInput,
    Dropdown,
    ErrorSummary,
    Form,
    InlineEdit,
    MultiSelect,
    NumberInput,
    PasswordInput,
    PinCodeInput,
    RadioButton,
    RadioButtonGroup,
    RangeSlider,
    Search,
    Select,
    SelectItem,
    Slider,
    TagInput,
    TextArea,
    TextInput,
    TimePicker,
    Toggle,
  } from "carbon-components-svelte";
  import { tick } from "svelte";

  export let focusOnShow = true;
  // Clears a 48px fixed header.
  export let scrollMargin = 48;

  const items = [
    { id: "0", text: "Ada" },
    { id: "1", text: "Grace" },
  ];

  /** Every field type: `id`, label text, and the error it shows. */
  const FIELDS = [
    "text",
    "password",
    "textarea",
    "number",
    "select",
    "dropdown",
    "combobox",
    "multiselect",
    "multiselect-filterable",
    "date",
    "range-start",
    "range-end",
    "time",
    "slider",
    "range-slider",
    "toggle",
    "checkbox",
    "checkbox-group",
    "radio-group",
    "pin",
    "tags",
    "search",
    "inline-edit",
  ];

  let form = null;
  let summary = null;
  let submitted = false;
  let submits = 0;
  /** @type {Array<{ fieldId?: string; message: string }>} */
  let errors = [];
  let title = "There is a problem";

  /** @param {string} name */
  const message = (name) => `Enter ${name}`;

  /** "auto" collects from the DOM; "manual" lists ids the app chose. */
  async function run(mode) {
    submitted = true;
    submits += 1;
    await tick();
    errors =
      mode === "auto"
        ? collectFormErrors(form)
        : FIELDS.map((name) => ({
            fieldId: `field-${name}`,
            message: message(name),
          }));
    title = `Fix ${errors.length} errors`;
    await tick();
    summary?.focus();
  }

  function onSubmit(event) {
    event.preventDefault();
    return run("auto");
  }

  function clear() {
    submitted = false;
    errors = [];
  }
</script>

<Form bind:ref={form} on:submit={onSubmit} novalidate data-testid="form">
  <ErrorSummary
    bind:this={summary}
    {errors}
    {title}
    {focusOnShow}
    {scrollMargin}
  />

  <p>Fill in every field.</p>
  <div class="gap">
    <TextInput
      id="field-text"
      labelText="Text"
      invalid={submitted}
      invalidText={message("text")}
    />
  </div>
  <div class="gap">
    <PasswordInput
      id="field-password"
      labelText="Password"
      invalid={submitted}
      invalidText={message("password")}
    />
  </div>
  <div class="gap">
    <TextArea
      id="field-textarea"
      labelText="Text area"
      invalid={submitted}
      invalidText={message("textarea")}
    />
  </div>
  <div class="gap">
    <NumberInput
      id="field-number"
      labelText="Number"
      invalid={submitted}
      invalidText={message("number")}
    />
  </div>
  <div class="gap">
    <Select
      id="field-select"
      labelText="Select"
      invalid={submitted}
      invalidText={message("select")}
    >
      <SelectItem value="a" text="A" />
    </Select>
  </div>
  <div class="gap">
    <Dropdown
      id="field-dropdown"
      labelText="Dropdown"
      {items}
      invalid={submitted}
      invalidText={message("dropdown")}
    />
  </div>
  <div class="gap">
    <ComboBox
      id="field-combobox"
      labelText="Combo box"
      {items}
      invalid={submitted}
      invalidText={message("combobox")}
    />
  </div>
  <div class="gap">
    <MultiSelect
      id="field-multiselect"
      labelText="Multi select"
      {items}
      invalid={submitted}
      invalidText={message("multiselect")}
    />
  </div>
  <div class="gap">
    <MultiSelect
      id="field-multiselect-filterable"
      labelText="Filterable multi select"
      filterable
      {items}
      invalid={submitted}
      invalidText={message("multiselect-filterable")}
    />
  </div>
  <div class="gap">
    <DatePicker datePickerType="single">
      <DatePickerInput
        id="field-date"
        labelText="Date"
        invalid={submitted}
        invalidText={message("date")}
      />
    </DatePicker>
  </div>
  <div class="gap">
    <DatePicker datePickerType="range">
      <DatePickerInput
        id="field-range-start"
        labelText="Start date"
        invalid={submitted}
        invalidText={message("range-start")}
      />
      <DatePickerInput
        id="field-range-end"
        labelText="End date"
        invalid={submitted}
        invalidText={message("range-end")}
      />
    </DatePicker>
  </div>
  <div class="gap">
    <TimePicker
      id="field-time"
      labelText="Time"
      invalid={submitted}
      invalidText={message("time")}
    />
  </div>
  <div class="gap">
    <Slider
      id="field-slider"
      labelText="Slider"
      invalid={submitted}
      invalidText={message("slider")}
    />
  </div>
  <div class="gap">
    <RangeSlider
      id="field-range-slider"
      labelText="Range slider"
      invalid={submitted}
      invalidText={message("range-slider")}
    />
  </div>
  <div class="gap">
    <Toggle
      id="field-toggle"
      labelText="Toggle"
      invalid={submitted}
      invalidText={message("toggle")}
    />
  </div>
  <div class="gap">
    <Checkbox
      id="field-checkbox"
      labelText="Checkbox"
      invalid={submitted}
      invalidText={message("checkbox")}
    />
  </div>
  <div class="gap">
    <CheckboxGroup
      id="field-checkbox-group"
      legendText="Checkbox group"
      invalid={submitted}
      invalidText={message("checkbox-group")}
    >
      <Checkbox labelText="Option A" />
      <Checkbox labelText="Option B" />
    </CheckboxGroup>
  </div>
  <div class="gap">
    <RadioButtonGroup
      id="field-radio-group"
      legendText="Radio group"
      invalid={submitted}
      invalidText={message("radio-group")}
    >
      <RadioButton value="a" labelText="Option A" />
      <RadioButton value="b" labelText="Option B" />
    </RadioButtonGroup>
  </div>
  <div class="gap">
    <PinCodeInput
      id="field-pin"
      labelText="Pin code"
      invalid={submitted}
      invalidText={message("pin")}
    />
  </div>
  <div class="gap">
    <TagInput
      id="field-tags"
      labelText="Tags"
      invalid={submitted}
      invalidText={message("tags")}
    />
  </div>
  <div class="gap">
    <Search
      id="field-search"
      labelText="Search"
      invalid={submitted}
      invalidText={message("search")}
    />
  </div>
  <div class="gap">
    <InlineEdit
      id="field-inline-edit"
      labelText="Inline edit"
      editLabel="Edit"
      saveLabel="Save"
      cancelLabel="Cancel"
      invalid={submitted}
      invalidText={message("inline-edit")}
    />
  </div>

  <Button type="submit" data-testid="submit">Submit</Button>
  <Button kind="secondary" type="button" on:click={() => run("manual")}
    >Submit with a list</Button
  >
  <Button kind="tertiary" type="button" on:click={clear}>Clear</Button>
  <output data-testid="submits">{submits}</output>
</Form>

<style>
  .gap {
    margin-block-end: 6rem;
  }
</style>
