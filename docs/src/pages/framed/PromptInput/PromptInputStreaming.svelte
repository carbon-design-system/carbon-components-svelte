<script>
  import { PromptInput, Stack, Text } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let status = "ready";
  let reply = "";
  let timers = [];

  // For demo purposes only: stands in for a request and a streamed reply.
  function ask() {
    reply = "";
    status = "submitted";
    timers.push(
      setTimeout(() => {
        status = "streaming";
        const words =
          "Two services failed: billing-api and the invoice worker.".split(" ");
        for (const [index, word] of words.entries()) {
          timers.push(
            setTimeout(
              () => {
                reply += `${word} `;
                if (index === words.length - 1) status = "ready";
              },
              250 * (index + 1),
            ),
          );
        }
      }, 1200),
    );
  }

  function stop() {
    for (const timer of timers) clearTimeout(timer);
    timers = [];
    status = "ready";
  }

  onMount(() => stop);
</script>

<Stack gap={5}>
  <PromptInput
    placeholder="Ask about your deployments"
    {status}
    on:submit={ask}
    on:stop={stop}
  />
  <Text>{reply || "No reply yet."}</Text>
</Stack>
