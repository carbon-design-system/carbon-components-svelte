<script lang="ts">
  import ChatLog from "carbon-components-svelte/Chat/ChatLog.svelte";
  import ChatMessage from "carbon-components-svelte/Chat/ChatMessage.svelte";

  export let typing = false;
</script>

<ChatLog labelText="Conversation with Sam">
  <ChatMessage
    from="me"
    author="You"
    status="sent"
    {typing}
    data-testid="message"
  >
    Thanks!
    <button slot="actions" type="button">Reply</button>
    <img slot="attachments" alt="Receipt" src="receipt.png" />
    <span slot="meta">9:41</span>
  </ChatMessage>
</ChatLog>
