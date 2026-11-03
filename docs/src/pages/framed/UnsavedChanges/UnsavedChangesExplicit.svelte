<script>
  import {
    createUnsavedChanges,
    Dropdown,
    Stack,
    Tag,
    trackUnsavedChanges,
  } from "carbon-components-svelte";

  const unsaved = createUnsavedChanges({ beforeUnload: false });
  const { dirty } = unsaved;
  const saved = "eu-west";
  const items = [
    { id: "us-east", text: "US East" },
    { id: "eu-west", text: "EU West" },
    { id: "ap-south", text: "Asia Pacific South" },
  ];

  let region = saved;
</script>

<!-- A Dropdown without a `name` renders no form element, so there is nothing
  to compare. Pass the flag yourself. -->
<div use:trackUnsavedChanges={{ store: unsaved, dirty: region !== saved }}>
  <Stack gap={5}>
    <Dropdown labelText="Region" {items} bind:selectedId={region} />
    {#if $dirty}
      <Tag type="warm-gray">Unsaved changes</Tag>
    {:else}
      <Tag type="green">Saved</Tag>
    {/if}
  </Stack>
</div>
