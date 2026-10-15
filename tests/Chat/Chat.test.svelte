<script lang="ts">
  import ChatDivider from "carbon-components-svelte/Chat/ChatDivider.svelte";
  import ChatLog from "carbon-components-svelte/Chat/ChatLog.svelte";
  import ChatMessage from "carbon-components-svelte/Chat/ChatMessage.svelte";

  export let typing = false;
</script>

<ChatLog labelText="Conversation with Sam">
  <ChatDivider>Today</ChatDivider>
  <ChatMessage data-testid="first">
    <span slot="avatar" data-testid="avatar-1">SC</span>
    Hi! How can I help?
  </ChatMessage>
  <ChatMessage continued data-testid="second">
    <span slot="avatar" data-testid="avatar-2">SC</span>
    Your order shipped this morning.
  </ChatMessage>
  <ChatMessage from="me" data-testid="mine">
    Thanks!
    <span slot="meta">Read</span>
  </ChatMessage>
  {#if typing}
    <ChatMessage typing typingText="Sam is typing" />
  {/if}
</ChatLog>
