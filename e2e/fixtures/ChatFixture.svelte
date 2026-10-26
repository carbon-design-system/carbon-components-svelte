<script lang="ts">
  import { Button, ChatLog, ChatMessage } from "carbon-components-svelte";

  let messages = Array.from(
    { length: 30 },
    (_, index) => `Message ${index + 1}`,
  );
</script>

<div style="display: flex; height: 240px; flex-direction: column; width: 320px">
  <ChatLog labelText="Conversation" data-testid="log">
    {#each messages as text, index (text)}
      <ChatMessage
        from={index % 2 ? "me" : "them"}
        author={index % 2 ? "You" : "Sam"}>{text}</ChatMessage
      >
    {/each}
  </ChatLog>
</div>
<ul style="list-style: none; padding: 0; width: 320px">
  <ChatMessage data-testid="no-meta">
    Grouped
    <svelte:fragment slot="meta">
      {#if false}
        9:41 AM
      {/if}
    </svelte:fragment>
  </ChatMessage>
</ul>
<Button
  data-testid="add"
  on:click={() => (messages = [...messages, `Message ${messages.length + 1}`])}
>
  Add
</Button>
<Button
  data-testid="send"
  on:click={() => {
    // Even messages come from "me"; skip ahead so the new one is mine.
    if (messages.length % 2 === 0)
      messages = [...messages, `Message ${messages.length + 1}`];
    messages = [...messages, `Message ${messages.length + 1}`];
  }}
>
  Send
</Button>
