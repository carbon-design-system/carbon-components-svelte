<script>
  import {
    InlineNotification,
    SelectItem,
    Slider,
    TextArea,
    TimePicker,
    TimePickerSelect,
    ToastNotification,
  } from "carbon-components-svelte";

  const kinds = ["warning", "warning-alt"];
</script>

<div
  style:display="grid"
  style:gap="16px"
  style:width="400px"
  style:padding="16px"
>
  <div data-testid="text-area">
    <TextArea
      labelText="Comment"
      value="Some text"
      warn
      warnText="This entry may be incorrect"
    />
  </div>

  <div data-testid="slider">
    <Slider
      labelText="Volume"
      value={50}
      warn
      warnText="This level may be too loud"
    />
  </div>

  <div data-testid="fluid-time-picker">
    <TimePicker
      fluid
      labelText="Time"
      value="09:30"
      warn
      warnText="This time may be incorrect"
    >
      <TimePickerSelect value="am" labelText="AM or PM">
        <SelectItem value="am" text="AM" />
      </TimePickerSelect>
    </TimePicker>
  </div>

  {#each kinds as kind}
    <div data-testid="inline-{kind}">
      <InlineNotification
        {kind}
        hideCloseButton
        title="Usage"
        subtitle="Build minutes are close to the limit."
      />
    </div>
    <div data-testid="inline-{kind}-low-contrast">
      <InlineNotification
        {kind}
        lowContrast
        hideCloseButton
        title="Usage"
        subtitle="Build minutes are close to the limit."
      />
    </div>
    <div data-testid="toast-{kind}">
      <ToastNotification
        {kind}
        hideCloseButton
        title="Usage"
        subtitle="Build minutes are close to the limit."
      />
    </div>
    <div data-testid="toast-{kind}-low-contrast">
      <ToastNotification
        {kind}
        lowContrast
        hideCloseButton
        title="Usage"
        subtitle="Build minutes are close to the limit."
      />
    </div>
  {/each}
</div>
