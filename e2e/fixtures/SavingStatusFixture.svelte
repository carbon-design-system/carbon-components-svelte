<script lang="ts">
  import {
    createAutosave,
    SavingStatus,
    Stack,
    TextArea,
    TextInput,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  // The test drives the fake server through `window.__saving`: `fail` is how
  // many of the next saves throw, and `delay` is how long each one takes.
  // The query sets the autosave's own timing.
  const query = new URLSearchParams(location.search);
  const num = (name: string, fallback: number) =>
    query.has(name) ? Number(query.get(name)) : fallback;

  const server = {
    saves: [] as Array<{ value: string; attempt: number }>,
    fail: 0,
    delay: num("delay", 120),
  };
  const hooks = window as unknown as Record<string, unknown>;
  hooks.__saving = server;

  let title = "Quarterly report";
  let notes = "";

  async function save(value: { title: string; notes: string }, { attempt }) {
    server.saves.push({ value: JSON.stringify(value), attempt });
    await new Promise((resolve) => setTimeout(resolve, server.delay));
    if (server.fail > 0) {
      server.fail -= 1;
      throw new Error("The server answered 503.");
    }
  }

  const autosave = createAutosave(save, {
    debounce: num("debounce", 1000),
    maxWait: num("maxWait", 5000),
    retry: { count: 3, delay: num("retryDelay", 1000) },
    initial: { title, notes },
  });
  hooks.__autosave = autosave;

  $: autosave.change({ title, notes });

  onMount(() => autosave.destroy);
</script>

<main>
  <Stack gap={6}>
    <Stack
      orientation="horizontal"
      gap={5}
      align="center"
      justify="space-between"
      data-testid="header"
    >
      <h4>{title}</h4>
      <SavingStatus {autosave} size="sm" data-testid="status-sm" />
    </Stack>
    <TextInput labelText="Title" bind:value={title} />
    <TextArea labelText="Notes" bind:value={notes} rows={3} />
    <SavingStatus {autosave} data-testid="status-md" />
  </Stack>
</main>
