<script>
  import {
    Button,
    Content,
    Header,
    InlineNotification,
    SidePanel,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  let open = true;
  let name = "checkout-api";
  let saved = name;
  let showWarning = false;

  $: dirty = name !== saved;
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Button
    on:click={() => {
      showWarning = false;
      open = true;
    }}
  >
    Rename service
  </Button>
</Content>

<SidePanel
  bind:open
  titleText="Rename service"
  on:close={(e) => {
    if (dirty && e.detail.trigger !== "programmatic") {
      e.preventDefault();
      showWarning = true;
    }
  }}
>
  <Stack gap={6}>
    {#if showWarning}
      <InlineNotification
        kind="warning"
        title="Unsaved changes"
        subtitle="Save or discard your changes to close the panel."
        hideCloseButton
      />
    {/if}
    <TextInput labelText="Service name" bind:value={name} />
  </Stack>
  <svelte:fragment slot="actions">
    <Button
      kind="secondary"
      on:click={() => {
        name = saved;
        open = false;
      }}
    >
      Discard
    </Button>
    <Button
      on:click={() => {
        saved = name;
        open = false;
      }}
    >
      Save
    </Button>
  </svelte:fragment>
</SidePanel>
