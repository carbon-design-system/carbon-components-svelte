<script>
  import { Button, Stack } from "carbon-components-svelte";

  let savingDraft = false;
  let publishing = false;

  async function simulate(duration) {
    await new Promise((resolve) => setTimeout(resolve, duration));
  }

  async function saveDraft() {
    savingDraft = true;
    await simulate(150);
    savingDraft = false;
  }

  async function publish() {
    publishing = true;
    await simulate(2000);
    publishing = false;
  }
</script>

<Stack orientation="horizontal" gap={5}>
  <Button
    kind="secondary"
    loading={savingDraft}
    loadingDelay={300}
    on:click={saveDraft}
  >
    Save draft (150 ms)
  </Button>
  <Button loading={publishing} loadingDelay={300} on:click={publish}>
    Publish (2 s)
  </Button>
</Stack>
