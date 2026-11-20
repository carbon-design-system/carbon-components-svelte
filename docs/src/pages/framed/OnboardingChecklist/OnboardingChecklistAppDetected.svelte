<script>
  import {
    Box,
    Button,
    createChecklistStore,
    InlineLoading,
    localChecklistStorage,
    OnboardingChecklist,
    Stack,
  } from "carbon-components-svelte";

  const store = createChecklistStore({
    storage: localChecklistStorage("docs:onboarding:detected"),
  });

  // The app's own state. A real app derives it from its data.
  let sourceConnected = false;
  let connecting = false;

  async function connect() {
    connecting = true;
    await new Promise((resolve) => setTimeout(resolve, 1200));
    sourceConnected = true;
    connecting = false;
  }

  function reset() {
    store.reset();
    sourceConnected = false;
  }

  $: tasks = [
    {
      id: "source",
      title: "Connect a metrics source",
      description: "Done for you once the first sample arrives.",
      section: "Monitoring",
      completed: sourceConnected,
    },
    {
      id: "alert",
      title: "Create your first alert",
      description: "Page the on-call engineer when p95 latency passes 800 ms.",
      section: "Monitoring",
    },
  ];
</script>

<Box maxWidth="28rem">
  <Stack gap={5}>
    <OnboardingChecklist title="Set up Acme Monitor" {tasks} {store} />
    <Stack orientation="horizontal" gap={3}>
      <Button
        size="small"
        disabled={sourceConnected || connecting}
        on:click={connect}
      >
        Connect a source elsewhere in the app
      </Button>
      {#if connecting}
        <InlineLoading description="Waiting for the first sample" />
      {/if}
      <Button kind="ghost" size="small" on:click={reset}>Reset</Button>
    </Stack>
  </Stack>
</Box>
