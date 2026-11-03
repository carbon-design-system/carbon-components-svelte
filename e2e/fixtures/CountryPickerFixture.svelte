<script>
  import { CountryPicker, Modal } from "carbon-components-svelte";

  // `?locale=` starts the pickers in a locale, and the buttons switch it at
  // runtime. `?dir=rtl` and `?theme=g100` set the page before anything mounts.
  const params = new URLSearchParams(window.location.search);
  if (params.get("dir") === "rtl") document.documentElement.dir = "rtl";
  if (params.get("theme") === "g100") {
    document.documentElement.classList.add("bx--g100");
  }
  let locale = params.get("locale") ?? "en";
  let value = "";
  let changes = [];
  let details = null;
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

<CountryPicker
  data-testid="country"
  labelText="Country"
  helperText="Where you live"
  flag="emoji"
  {locale}
  bind:value
  on:change={(event) => {
    details = event.detail;
    changes = [...changes, event.detail.value];
  }}
/>
<output data-testid="country-value">{value}</output>
<output data-testid="country-changes">{changes.join(",")}</output>
<output data-testid="country-native">{details?.nativeName ?? ""}</output>

<CountryPicker
  data-testid="country-badge"
  labelText="Badge"
  flag="badge"
  value="CH"
  {locale}
/>

<CountryPicker
  data-testid="country-none"
  labelText="No flag"
  flag="none"
  values={["US", "CA", "MX"]}
  {locale}
/>

<CountryPicker
  data-testid="country-auto"
  labelText="Automatic flag"
  {locale}
  invalid
  invalidText="Choose a country"
/>

<CountryPicker
  data-testid="country-detect"
  labelText="Detected"
  detect
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
  <CountryPicker
    labelText="Modal country"
    flag="emoji"
    bind:value={modalValue}
  />
</Modal>
<output data-testid="modal-value">{modalValue}</output>
