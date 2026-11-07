<script>
  import { NaturalDateInput, Stack } from "carbon-components-svelte";

  let detail = null;
</script>

<Stack gap={6}>
  <NaturalDateInput
    labelText="Deadline"
    on:change={(event) => (detail = event.detail)}
  />
  <pre>{detail
      ? JSON.stringify(
          {
            iso: detail.iso,
            text: detail.text,
            valid: detail.valid,
            trigger: detail.trigger,
          },
          null,
          2,
        )
      : "Type a date, then press Enter or leave the field."}</pre>
</Stack>
