<script>
  import {
    Button,
    ChatDivider,
    ChatLog,
    ChatMessage,
    InputGroup,
    TextInput,
    UserAvatar,
  } from "carbon-components-svelte";
  import Send from "carbon-icons-svelte/lib/Send.svelte";

  let messages = [
    {
      id: 1,
      from: "them",
      text: "Hi! I'm Sam. How can I help with your order today?",
    },
    {
      id: 2,
      from: "them",
      text: "I can see it left the warehouse this morning.",
    },
    { id: 3, from: "me", text: "Great. Can it come to my office instead?" },
  ];
  let draft = "";
  let typing = false;

  function send() {
    const text = draft.trim();
    if (!text) return;
    messages = [...messages, { id: Date.now(), from: "me", text }];
    draft = "";
    typing = true;
    setTimeout(() => {
      typing = false;
      messages = [
        ...messages,
        {
          id: Date.now(),
          from: "them",
          text: "Done. I've updated the address.",
        },
      ];
    }, 1200);
  }
</script>

<div style="display: flex; height: 22rem; flex-direction: column; gap: 1rem">
  <ChatLog labelText="Conversation with Sam" style="flex: 1">
    <ChatDivider>Today</ChatDivider>
    {#each messages as message, index (message.id)}
      <ChatMessage
        from={message.from}
        continued={messages[index - 1]?.from === message.from}
      >
        <UserAvatar slot="avatar" size="sm" name="Sam Carter" />
        {message.text}
      </ChatMessage>
    {/each}
    {#if typing}
      <ChatMessage typing typingText="Sam is typing">
        <UserAvatar slot="avatar" size="sm" name="Sam Carter" />
      </ChatMessage>
    {/if}
  </ChatLog>
  <form on:submit|preventDefault={send}>
    <InputGroup labelText="Message" hideLabel>
      <TextInput
        hideLabel
        labelText="Message"
        placeholder="Write a message"
        bind:value={draft}
      />
      <Button type="submit" icon={Send} iconDescription="Send" />
    </InputGroup>
  </form>
</div>
