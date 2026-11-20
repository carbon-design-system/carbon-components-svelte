<script>
  import {
    Button,
    createTipStore,
    InlineTip,
    Stack,
  } from "carbon-components-svelte";

  let writes = [];

  // For demo purposes only: a real adapter calls your preferences API.
  function serverTipStorage() {
    let saved = ["server-billing"];
    return {
      async read() {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return saved;
      },
      async write(ids) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        saved = ids;
        writes = [...writes, ids];
      },
    };
  }

  const tips = createTipStore({ storage: serverTipStorage() });
</script>

<Stack gap={5}>
  <InlineTip id="server-billing" title="Download invoices" store={tips}>
    Open Billing to download an invoice as a PDF. This tip was dismissed on
    another device, so it never shows here.
  </InlineTip>
  <InlineTip id="server-roles" title="Assign roles" store={tips}>
    Give each teammate the access their work needs, no more.
  </InlineTip>
  <Button kind="tertiary" size="small" on:click={() => tips.reset()}>
    Show tips again
  </Button>
  <pre>{JSON.stringify(writes, null, 2)}</pre>
</Stack>
