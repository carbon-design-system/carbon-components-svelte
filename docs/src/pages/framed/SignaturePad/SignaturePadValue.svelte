<script>
  import { SignaturePad, Stack } from "carbon-components-svelte";

  let value = $state(null);

  const preview = $derived(
    value?.svg
      ? `data:image/svg+xml;utf8,${encodeURIComponent(value.svg)}`
      : "",
  );
</script>

<Stack gap={5}>
  <SignaturePad bind:value labelText="Signature" />
  <div>type: {value ? value.type : "none"}</div>
  {#if preview}
    <img src={preview} alt="The signature as exported" width="300" />
  {/if}
</Stack>
