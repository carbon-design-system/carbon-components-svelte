<svelte:options accessors />

<script lang="ts">
  import ChatLog from "carbon-components-svelte/Chat/ChatLog.svelte";
  import ChatMessage from "carbon-components-svelte/Chat/ChatMessage.svelte";

  export let atLatest = true;
  export let jumps = 0;
  export let count = 30;
</script>

<ChatLog
  labelText="Conversation"
  data-testid="log"
  bind:atLatest
  on:jump={() => (jumps += 1)}
>
  {#each Array.from({ length: count }, (_, i) => i + 1) as n (n)}
    <ChatMessage author="Sam">Message {n}</ChatMessage>
  {/each}
</ChatLog>
<output data-testid="at-latest">{atLatest}</output>
