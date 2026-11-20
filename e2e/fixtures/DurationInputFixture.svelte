<script>
  import {
    Button,
    DurationInput,
    Modal,
    Stack,
  } from "carbon-components-svelte";

  let value = 5_400_000;
  let textValue = null;
  let modalValue = null;
  let open = false;
  let changes = 0;
</script>

<Stack gap={7}>
  <div data-testid="duration-default">
    <DurationInput
      labelText="Session length"
      helperText="Hours, minutes and seconds"
      bind:value
      on:change={() => (changes += 1)}
    />
    <span data-testid="duration-value">{value}</span>
    <span data-testid="duration-changes">{changes}</span>
  </div>

  <div data-testid="duration-text">
    <DurationInput
      variant="text"
      labelText="Time estimate"
      smallestUnit="minute"
      helperText="Try 1h 30m, 90m, 1.5h or PT1H30M"
      bind:value={textValue}
    />
    <span data-testid="duration-text-value">{textValue}</span>
  </div>

  <div data-testid="duration-days">
    <DurationInput
      labelText="Retention"
      largestUnit="day"
      smallestUnit="millisecond"
      value={93_784_005}
    />
  </div>

  <div data-testid="duration-step">
    <DurationInput
      labelText="Reminder"
      smallestUnit="minute"
      step={15}
      max={7_200_000}
      value={900_000}
    />
  </div>

  <div data-testid="duration-invalid">
    <DurationInput
      labelText="Timeout"
      invalid
      invalidText="Timeout must be under one hour"
      value={7_200_000}
    />
  </div>

  <div data-testid="duration-warn">
    <DurationInput
      labelText="Cache lifetime"
      warn
      warnText="Short lifetimes raise server load"
      value={5000}
    />
  </div>

  <div data-testid="duration-disabled">
    <DurationInput labelText="Disabled" disabled value={60_000} />
  </div>

  <div data-testid="duration-readonly">
    <DurationInput labelText="Read only" readonly value={60_000} />
  </div>

  <div data-testid="duration-sizes">
    <DurationInput labelText="Small" size="sm" value={60_000} />
  </div>

  <div data-testid="duration-german">
    <DurationInput
      labelText="Dauer"
      locale="de"
      unitDisplay="short"
      value={3_723_000}
    />
  </div>

  <Button data-testid="duration-open" on:click={() => (open = true)}
    >Open modal</Button
  >
  <span data-testid="duration-modal-value">{modalValue}</span>
</Stack>

<Modal
  bind:open
  modalHeading="Snooze"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
>
  <div data-testid="duration-modal">
    <DurationInput labelText="Snooze for" bind:value={modalValue} />
  </div>
</Modal>
