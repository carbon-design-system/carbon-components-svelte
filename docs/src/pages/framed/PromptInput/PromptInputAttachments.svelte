<script>
  import { PromptInput, Stack, Text } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let attachments = [];
  let sent = "";
  const timers = [];

  const update = (id, change) =>
    (attachments = attachments.map((item) =>
      item.id === id ? { ...item, ...change } : item,
    ));

  // For demo purposes only: stands in for an upload that reports progress.
  function upload({ detail }) {
    for (const item of detail.items) {
      update(item.id, { status: "uploading", progress: 0 });
      const timer = setInterval(() => {
        const current = attachments.find((a) => a.id === item.id);
        if (!current) return clearInterval(timer);
        const progress = (current.progress ?? 0) + 20;
        if (progress >= 100) {
          clearInterval(timer);
          update(item.id, { status: "complete", progress: 100 });
        } else {
          update(item.id, { progress });
        }
      }, 300);
      timers.push(timer);
    }
  }

  onMount(() => () => {
    for (const timer of timers) clearInterval(timer);
  });
</script>

<Stack gap={5}>
  <PromptInput
    placeholder="Ask about a log, a screenshot or a report"
    accept="image/*,.pdf,.txt,.log"
    maxFiles={4}
    maxFileSize={5_000_000}
    bind:attachments
    on:attach={upload}
    on:submit={(event) =>
      (sent = `${event.detail.text || "(no text)"} with ${
        event.detail.attachments.length
      } file(s)`)}
  />
  {#if sent}
    <Text>Sent: {sent}</Text>
  {/if}
</Stack>
