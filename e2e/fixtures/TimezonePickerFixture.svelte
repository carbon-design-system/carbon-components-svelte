<script>
  import { Modal, TimezonePicker } from "carbon-components-svelte";

  // `?locale=` starts the pickers in a locale, and the buttons switch it at
  // runtime. `?dir=rtl` and `?theme=g100` set the page before anything mounts.
  const params = new URLSearchParams(window.location.search);
  if (params.get("dir") === "rtl") document.documentElement.dir = "rtl";
  if (params.get("theme") === "g100") {
    document.documentElement.classList.add("bx--g100");
  }
  let locale = params.get("locale") ?? "en";
  let value = "";
  let detected = "";
  let changes = [];

  // January, so the offsets do not depend on the day the test runs.
  const winter = new Date("2026-01-15T12:00:00Z");
  let modalOpen = false;
  let modalValue = "";
</script>

<button type="button" data-testid="outside-target">Outside target</button>

{#each ["en", "ar", "he", "ja"] as option}
  <button
    type="button"
    data-testid="locale-{option}"
    on:click={() => (locale = option)}>{option}</button
  >
{/each}

<TimezonePicker
  data-testid="tz"
  labelText="Time zone"
  helperText="Choose where you are"
  detect={false}
  date={winter}
  {locale}
  bind:value
  on:change={(event) => (changes = [...changes, event.detail.value])}
/>
<output data-testid="tz-value">{value}</output>
<output data-testid="tz-changes">{changes.join(",")}</output>

<TimezonePicker
  data-testid="tz-selected"
  labelText="Selected"
  detect={false}
  date={winter}
  {locale}
  value="Asia/Calcutta"
/>

<TimezonePicker
  data-testid="tz-detect"
  labelText="Detected"
  {locale}
  bind:value={detected}
/>
<output data-testid="tz-detected">{detected}</output>

<TimezonePicker
  data-testid="tz-invalid"
  labelText="Invalid"
  detect={false}
  invalid
  invalidText="Choose a time zone"
  {locale}
/>

<TimezonePicker
  data-testid="tz-disabled"
  labelText="Disabled"
  detect={false}
  disabled
  value="Europe/Paris"
  {locale}
/>

<button
  type="button"
  data-testid="open-modal"
  on:click={() => (modalOpen = true)}
>
  Open modal
</button>

<Modal
  bind:open={modalOpen}
  size="sm"
  modalHeading="Preferences"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (modalOpen = false)}
>
  <TimezonePicker
    labelText="Modal time zone"
    detect={false}
    bind:value={modalValue}
  />
</Modal>
<output data-testid="modal-value">{modalValue}</output>
