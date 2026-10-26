<svelte:options accessors />

<script lang="ts">
  import ChatDivider from "carbon-components-svelte/Chat/ChatDivider.svelte";
  import ChatLog from "carbon-components-svelte/Chat/ChatLog.svelte";
  import ChatMessage from "carbon-components-svelte/Chat/ChatMessage.svelte";

  export let typing = false;
  export let streaming = false;
  export let status:
    "sending" | "sent" | "delivered" | "read" | "failed" | undefined =
    undefined;
  export let retries = 0;
</script>

<ChatLog labelText="Conversation with Sam">
  <ChatDivider>Today</ChatDivider>
  <ChatMessage author="Sam" showAuthor data-testid="first">
    <span slot="avatar" data-testid="avatar-1">SC</span>
    Hi! How can I help?
  </ChatMessage>
  <ChatMessage
    author="Sam"
    showAuthor
    continued
    {streaming}
    data-testid="second"
  >
    <span slot="avatar" data-testid="avatar-2">SC</span>
    Your order shipped this morning.
  </ChatMessage>
  <ChatMessage
    from="me"
    author="You"
    {status}
    data-testid="mine"
    on:retry={() => (retries += 1)}
  >
    Thanks!
    <img slot="attachments" alt="Receipt" src="receipt.png" />
    <span slot="meta">9:41</span>
  </ChatMessage>
  {#if typing}
    <ChatMessage typing typingText="Sam is typing" />
  {/if}
</ChatLog>
