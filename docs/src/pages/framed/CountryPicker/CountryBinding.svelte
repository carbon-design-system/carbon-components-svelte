<script>
  import { CountryPicker, Stack } from "carbon-components-svelte";

  let value = "CH";
  let detail = null;
</script>

<Stack gap={5}>
  <CountryPicker
    labelText="Country"
    bind:value
    on:change={(event) => (detail = event.detail)}
  />
  <p>value: {value || "(empty)"}</p>
  {#if detail?.value}
    <p>
      {detail.flag}
      {detail.name}{detail.nativeName ? `, ${detail.nativeName}` : ""}
    </p>
  {/if}
</Stack>
