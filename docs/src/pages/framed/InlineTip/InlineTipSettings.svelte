<script>
  import {
    Button,
    createTipStore,
    InlineTip,
    localTipStorage,
    setTipStore,
    Stack,
    Toggle,
  } from "carbon-components-svelte";

  const tips = createTipStore({
    storage: localTipStorage("docs:settings-tips"),
  });

  // Every InlineTip and Guidebanner below this component uses the store.
  setTipStore(tips);

  let sync = false;

  function turnOnSync() {
    sync = true;
    // The user did what the tip taught, so it has done its job.
    tips.dismiss("settings-sync");
  }
</script>

<Stack gap={5}>
  <InlineTip id="settings-sync" title="Sync your settings" href="#sync">
    Keep your layout, filters and theme on every device you sign in to.
    <Button slot="actions" kind="tertiary" size="small" on:click={turnOnSync}>
      Turn on sync
    </Button>
  </InlineTip>
  <Toggle labelText="Sync settings" bind:toggled={sync} />
  <InlineTip
    id="settings-export"
    title="Export your data"
    collapsible
    href="#export"
  >
    Download every project, comment and setting as a ZIP archive from the
    Privacy page.
  </InlineTip>
</Stack>
