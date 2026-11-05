<script>
  import { PromptInput, Stack } from "carbon-components-svelte";

  let value = "";
  let history = ["Which services failed their health check last night?"];
  let sent = [];
</script>

<Stack gap={5}>
  <PromptInput
    placeholder="Ask about your deployments"
    bind:value
    bind:history
    on:submit={(event) => (sent = [...sent, event.detail.text])}
  />
  {#if sent.length > 0}
    <ol>
      {#each sent as text}
        <li>{text}</li>
      {/each}
    </ol>
  {/if}
</Stack>
