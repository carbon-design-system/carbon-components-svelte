<script>
  import {
    Checkbox,
    ComboBox,
    createUnsavedChanges,
    DatePicker,
    DatePickerInput,
    Dropdown,
    FileUploader,
    FileUploaderDropContainer,
    FluidForm,
    Form,
    MultiSelect,
    NumberInput,
    RadioButton,
    RadioButtonGroup,
    Select,
    SelectItem,
    Slider,
    TextArea,
    TextInput,
    Toggle,
    trackUnsavedChanges,
  } from "carbon-components-svelte";

  const params = new URLSearchParams(location.search);
  const fluid = params.has("fluid");
  const native = params.has("native");
  const unsaved = createUnsavedChanges();
  const { dirty, count } = unsaved;
  const items = [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
    { id: "c", text: "Gamma" },
  ];

  let text = "Ada";
  let notes = "Hello";
  let seats = 2;
  let selected = "one";
  let comboId = "a";
  let dropdownId = "a";
  let namedDropdownId = "a";
  let multiIds = ["a"];
  let agree = false;
  let plan = "free";
  let toggled = false;
  let date = "03/15/2024";
  let level = 20;
  let files = [];
  let dropped = [];
  let saved = 0;

  const form = fluid ? FluidForm : Form;

  /** @param {SubmitEvent} event */
  function handleSubmit(event) {
    if (native) return;
    event.preventDefault();
    if (event.submitter?.dataset.result === "ok") {
      unsaved.markSaved();
      saved += 1;
    }
  }
  const actions = [[trackUnsavedChanges, { store: unsaved }]];
</script>

<svelte:component
  this={form}
  data-testid="form"
  {actions}
  method={native ? "post" : undefined}
  action={native ? "/unsaved-changes-target" : undefined}
  on:submit={handleSubmit}
>
  <div data-testid="text-input">
    <TextInput labelText="Text" bind:value={text} />
  </div>
  <div data-testid="text-area">
    <TextArea labelText="Notes" bind:value={notes} />
  </div>
  <div data-testid="number-input">
    <NumberInput label="Seats" bind:value={seats} />
  </div>
  <div data-testid="select">
    <Select labelText="Select" bind:selected>
      <SelectItem value="one" text="One" />
      <SelectItem value="two" text="Two" />
    </Select>
  </div>
  <div data-testid="combo-box">
    <ComboBox
      titleText="Combo"
      placeholder="Pick"
      {items}
      bind:selectedId={comboId}
    />
  </div>
  <!-- Without a `name`, Dropdown renders no form element at all. -->
  <div
    data-testid="dropdown"
    use:trackUnsavedChanges={{
      store: unsaved,
      id: "dropdown",
      dirty: dropdownId !== "a",
    }}
  >
    <Dropdown
      labelText="Dropdown"
      label="Dropdown"
      {items}
      bind:selectedId={dropdownId}
    />
  </div>
  <div data-testid="dropdown-named">
    <Dropdown
      labelText="Named dropdown"
      label="Named dropdown"
      name="named"
      {items}
      bind:selectedId={namedDropdownId}
    />
  </div>
  <div data-testid="multi-select">
    <MultiSelect
      titleText="Multi"
      label="Multi"
      {items}
      bind:selectedIds={multiIds}
    />
  </div>
  <div data-testid="checkbox">
    <Checkbox labelText="Agree" bind:checked={agree} />
  </div>
  <div data-testid="radio">
    <RadioButtonGroup legendText="Plan" bind:selected={plan}>
      <RadioButton labelText="Free" value="free" />
      <RadioButton labelText="Pro" value="pro" />
    </RadioButtonGroup>
  </div>
  <div data-testid="toggle">
    <Toggle labelText="Toggle" bind:toggled />
  </div>
  <div data-testid="date-picker">
    <DatePicker datePickerType="single" bind:value={date} {fluid}>
      <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
    </DatePicker>
  </div>
  <div data-testid="file-uploader">
    <FileUploader
      labelTitle="Files"
      buttonLabel="Add file"
      status="edit"
      multiple
      iconDescription="Remove file"
      bind:files
    />
  </div>
  <div data-testid="drop-container">
    <FileUploaderDropContainer
      labelText="Drop files here"
      multiple
      on:add={(event) => (dropped = [...dropped, ...event.detail])}
    />
    <p data-testid="dropped">{dropped.length}</p>
  </div>
  <div data-testid="slider">
    <Slider labelText="Level" min={0} max={100} bind:value={level} />
  </div>
  <button type="submit" data-result="ok">Save</button>
  <button type="submit" data-result="fail">Save (fails)</button>
  <button type="reset">Reset</button>
</svelte:component>

<button
  type="button"
  on:click={() => {
    unsaved.markSaved();
    saved += 1;
  }}>Mark saved</button
>
<p data-testid="status">
  {$dirty ? "dirty" : "clean"}:{$count}:{saved}
</p>
