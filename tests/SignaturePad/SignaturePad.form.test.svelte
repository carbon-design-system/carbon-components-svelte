<script lang="ts">
  import SignaturePad from "carbon-components-svelte/SignaturePad/SignaturePad.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<SignaturePad>["value"] = null;
  export let required = false;
</script>

<form data-testid="form">
  <SignaturePad bind:value {required} name="signature" labelText="Signature" />
  <button type="submit">Submit</button>
</form>
<p data-testid="bound">{value ? value.type : ""}</p>
