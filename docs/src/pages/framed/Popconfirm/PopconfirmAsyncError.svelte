<script>
  import { Button, Popconfirm, Stack } from "carbon-components-svelte";

  let deleted = false;

  // For demo purposes only: fails on the first attempt.
  let attempts = 0;
  async function deleteVolume() {
    await new Promise((resolve) => setTimeout(resolve, 800));
    attempts += 1;
    if (attempts === 1) throw new Error("The volume is still attached.");
    deleted = true;
  }
</script>

<Stack orientation="horizontal" gap={5} align="center">
  <Popconfirm
    title="Delete volume data-01?"
    confirmText="Delete"
    loadingDescription="Deleting"
    confirm={deleteVolume}
    errorText={(error) =>
      error instanceof Error ? error.message : "Something went wrong."}
  >
    <Button kind="danger-tertiary" size="small" disabled={deleted}>
      Delete volume
    </Button>
  </Popconfirm>
  <span>{deleted ? "Volume deleted" : "Volume data-01"}</span>
</Stack>
