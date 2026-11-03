<script>
  import { LanguagePicker, Stack } from "carbon-components-svelte";

  let value = "fr";
  let detail = null;
</script>

<Stack gap={5}>
  <LanguagePicker
    labelText="Language"
    bind:value
    on:change={(event) => (detail = event.detail)}
  />
  <p>value: {value || "(empty)"}</p>
  {#if detail?.value}
    <p>
      {detail.name}{detail.endonym ? `, ${detail.endonym}` : ""} ({detail.dir})
    </p>
  {/if}
</Stack>
