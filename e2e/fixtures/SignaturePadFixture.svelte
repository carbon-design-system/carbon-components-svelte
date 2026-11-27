<script>
  import { Button, SignaturePad, Stack } from "carbon-components-svelte";

  let value = null;
  let mode = "draw";
  let formValue = null;
  let submitted = "";
  let changes = 0;
  let pad;

  $: if (typeof window !== "undefined") window.__signature = value;
  $: if (typeof window !== "undefined") window.__pad = pad;
</script>

<Stack gap={7}>
  <div data-testid="signature-default">
    <SignaturePad
      bind:this={pad}
      bind:value
      bind:mode
      modes={["draw", "type", "upload"]}
      formats={["svg", "png"]}
      labelText="Signature"
      helperText="Sign to approve this invoice"
      on:change={() => (changes += 1)}
    />
    <span data-testid="signature-type">{value ? value.type : ""}</span>
    <span data-testid="signature-mode">{mode}</span>
    <span data-testid="signature-changes">{changes}</span>
  </div>

  <form
    data-testid="signature-form"
    on:submit|preventDefault={(event) => {
      submitted = String(new FormData(event.currentTarget).get("signature"));
    }}
  >
    <Stack gap={5}>
      <SignaturePad
        bind:value={formValue}
        name="signature"
        required
        labelText="Approver signature"
      />
      <Button type="submit">Approve</Button>
    </Stack>
  </form>
  <span data-testid="signature-submitted">{submitted ? "submitted" : ""}</span>

  <div data-testid="signature-invalid">
    <SignaturePad
      labelText="Delivery signature"
      invalid
      invalidText="Signature is required"
    />
  </div>

  <div data-testid="signature-disabled">
    <SignaturePad labelText="Disabled signature" disabled />
  </div>
</Stack>
