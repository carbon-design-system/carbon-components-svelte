<script>
  import { Button, Popconfirm, Stack } from "carbon-components-svelte";

  let revoked = false;

  async function revokeKey() {
    // For demo purposes only: stands in for a network call.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    revoked = true;
  }
</script>

<Stack orientation="horizontal" gap={5} align="center">
  <Popconfirm
    title="Revoke this API key?"
    description="Requests that use it fail right away."
    confirmText="Revoke"
    loadingDescription="Revoking"
    confirm={revokeKey}
  >
    <Button kind="danger" size="small" disabled={revoked}>Revoke key</Button>
  </Popconfirm>
  <span>{revoked ? "Key revoked" : "Key active"}</span>
</Stack>
