<script>
  import {
    InlineNotification,
    MergeResolver,
    Stack,
  } from "carbon-components-svelte";

  const base = `replicas: 2
region: us-south
`;
  const ours = `replicas: 0
region: us-south
`;
  const theirs = `replicas: 3
region: eu-de
`;

  let error = "";
  let saved = false;

  function validate(event) {
    const replicas = Number(/replicas: (\d+)/.exec(event.detail.text)?.[1]);
    saved = false;
    if (replicas < 1) {
      // Keep the merge unresolved so the user can fix the line.
      event.preventDefault();
      error =
        "A service needs at least one replica. Edit the result and try again.";
    } else {
      error = "";
      saved = true;
    }
  }
</script>

<Stack gap={5}>
  <MergeResolver {base} {ours} {theirs} height="16rem" on:resolve={validate} />
  {#if error}
    <InlineNotification
      lowContrast
      hideCloseButton
      kind="error"
      title="Not resolved"
      subtitle={error}
    />
  {:else if saved}
    <InlineNotification
      lowContrast
      hideCloseButton
      kind="success"
      title="Resolved"
      subtitle="The merged file passed validation."
    />
  {/if}
</Stack>
