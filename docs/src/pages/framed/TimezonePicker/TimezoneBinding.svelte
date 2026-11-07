<script>
  import { Stack, TimezonePicker } from "carbon-components-svelte";

  let value = "Asia/Tokyo";
  let detail = null;
</script>

<Stack gap={5}>
  <TimezonePicker
    labelText="Time zone"
    bind:value
    on:change={(event) => (detail = event.detail)}
  />
  <p>value: {value || "(empty)"}</p>
  {#if detail}
    <p>
      {detail.label}, {detail.offsetText}{detail.observesDst
        ? detail.dst
          ? ", daylight time"
          : ", standard time"
        : ""}
    </p>
  {/if}
</Stack>
