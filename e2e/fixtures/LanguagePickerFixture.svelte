<script>
  import { LanguagePicker, Modal } from "carbon-components-svelte";

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

<LanguagePicker
  data-testid="language"
  labelText="Language"
  helperText="Used for messages"
  {locale}
  bind:value
  on:change={(event) => (changes = [...changes, event.detail.value])}
/>
<output data-testid="language-value">{value}</output>
<output data-testid="language-changes">{changes.join(",")}</output>

<LanguagePicker
  data-testid="language-variants"
  labelText="With variants"
  variants
  value="pt-BR"
  {locale}
/>

<LanguagePicker
  data-testid="language-values"
  labelText="Supported"
  values={["en", "fr", "ar", "he"]}
  {locale}
/>

<LanguagePicker
  data-testid="language-invalid"
  labelText="Invalid"
  invalid
  invalidText="Choose a language"
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
  <LanguagePicker labelText="Modal language" bind:value={modalValue} />
</Modal>
<output data-testid="modal-value">{modalValue}</output>
