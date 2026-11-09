<script>
  import {
    Button,
    InlineLoading,
    Motion,
    Stack,
    Toggle,
  } from "carbon-components-svelte";

  let animate = true;
  let saving = false;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  function save() {
    clearTimeout(timer);
    saving = true;
    timer = setTimeout(() => (saving = false), 1500);
  }
</script>

<Motion transition={animate}>
  <Stack gap={6}>
    <Toggle labelText="Motion" bind:toggled={animate} />
    <Stack orientation="horizontal" gap={5} align="center">
      <Button kind="tertiary" disabled={saving} on:click={save}>
        Save changes
      </Button>
      {#if saving}
        <InlineLoading description="Saving..." />
      {/if}
    </Stack>
  </Stack>
</Motion>
