<script>
  import {
    createAutosave,
    SavingStatus,
    Stack,
    TextArea,
    TextInput,
    Toggle,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let title = "Quarterly report";
  let summary = "";

  // Simulate the server and the network.
  let failing = false;
  let offline = false;

  // A stand-in for your API.
  async function save() {
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (failing) throw new Error("The server answered 503. Try again soon.");
  }

  const autosave = createAutosave(save, {
    debounce: 800,
    maxWait: 6000,
    retry: { count: 2, delay: 1000 },
    initial: { title, summary },
  });
  onMount(() => autosave.destroy);

  // `initial` makes the run on mount a no-op, and typing a change back
  // leaves the form clean.
  $: autosave.change({ title, summary });
  $: autosave.setOnline(!offline);
</script>

<Stack gap={6}>
  <Stack
    orientation="horizontal"
    gap={5}
    align="center"
    justify="space-between"
  >
    <h4>Report details</h4>
    <SavingStatus {autosave} />
  </Stack>
  <TextInput labelText="Title" bind:value={title} />
  <TextArea labelText="Summary" bind:value={summary} rows={4} />
  <Stack orientation="horizontal" gap={6}>
    <Toggle labelText="Server fails" size="sm" bind:toggled={failing} />
    <Toggle labelText="Offline" size="sm" bind:toggled={offline} />
  </Stack>
</Stack>
