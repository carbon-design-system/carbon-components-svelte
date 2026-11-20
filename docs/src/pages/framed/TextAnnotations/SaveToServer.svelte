<script>
  import {
    InlineLoading,
    Stack,
    TextAnnotations,
  } from "carbon-components-svelte";

  const text =
    "Deploy 2026.11.4 rolled out to us-east at 14:02 UTC. Error rate on the checkout API rose from 0.2% to 3.1% within five minutes, so the rollout was paused at 25% of instances.";

  function note(id, quote, name, body) {
    const start = text.indexOf(quote);
    return {
      id,
      range: { start, end: start + quote.length },
      quote,
      comments: [{ id: `${id}-1`, author: { name }, body }],
    };
  }

  let annotations = [
    note("rate", "from 0.2% to 3.1%", "Grace Hopper", "Alert threshold is 1%."),
  ];
  let saving = false;

  async function handleCreate(event) {
    // Keep the annotation out of the list until the server has accepted it.
    event.preventDefault();
    const { annotation } = event.detail;
    saving = true;
    // For demo purposes only: a real app would send the annotation here.
    await new Promise((resolve) => setTimeout(resolve, 800));
    annotations = [
      ...annotations,
      { ...annotation, id: `saved-${annotations.length + 1}` },
    ];
    saving = false;
  }
</script>

<Stack gap={5}>
  <TextAnnotations
    bind:annotations
    {text}
    labelText="Incident summary"
    user={{ id: "ada", name: "Ada Lovelace" }}
    on:create={handleCreate}
  />
  {#if saving}
    <InlineLoading description="Saving the comment..." />
  {/if}
</Stack>
