<script>
  import {
    Box,
    Button,
    ChatDivider,
    ChatLog,
    ChatMessage,
    groupChatMessages,
    InputGroup,
    RelativeTime,
    TextArea,
    UserAvatar,
  } from "carbon-components-svelte";
  import Send from "carbon-icons-svelte/lib/Send.svelte";

  const minutesAgo = (minutes) => Date.now() - minutes * 60_000;

  let messages = [
    {
      id: 1,
      from: "them",
      author: "Sam",
      time: minutesAgo(26 * 60),
      text: "Your order left the warehouse. It should arrive tomorrow.",
    },
    {
      id: 2,
      from: "them",
      author: "Sam",
      time: minutesAgo(12),
      text: "Hi again! Anything else I can help with?",
    },
    {
      id: 3,
      from: "them",
      author: "Sam",
      time: minutesAgo(11),
      text: "I can change the address or the delivery day.",
    },
    {
      id: 4,
      from: "me",
      author: "You",
      time: minutesAgo(2),
      text: "Can it come to my office instead?",
      status: "read",
    },
  ];
  let draft = "";
  let typing = false;

  // For demo purposes only: stands in for sending the message and the reply.
  function send() {
    const text = draft.trim();
    if (!text) return;
    const id = Date.now();
    messages = [
      ...messages,
      { id, from: "me", author: "You", time: id, text, status: "sending" },
    ];
    draft = "";
    const setStatus = (status) =>
      (messages = messages.map((message) =>
        message.id === id ? { ...message, status } : message,
      ));
    setTimeout(() => setStatus("delivered"), 500);
    setTimeout(() => {
      setStatus("read");
      typing = true;
    }, 900);
    setTimeout(() => {
      typing = false;
      messages = [
        ...messages,
        {
          id: Date.now(),
          from: "them",
          author: "Sam",
          time: Date.now(),
          text: "Done. I've updated the address.",
        },
      ];
    }, 2100);
  }
</script>

<Box display="flex" direction="column" height="26rem" gap={5}>
  <ChatLog labelText="Conversation with Sam">
    {#each groupChatMessages(messages) as item (item.key)}
      {#if item.type === "divider"}
        <ChatDivider>{item.label}</ChatDivider>
      {:else}
        <ChatMessage
          from={item.message.from}
          author={item.message.author}
          continued={item.continued}
          status={item.last ? item.message.status : undefined}
        >
          <UserAvatar slot="avatar" size="sm" name="Sam Carter" />
          {item.message.text}
          <svelte:fragment slot="meta">
            {#if item.last}
              <RelativeTime date={item.message.time} />
            {/if}
          </svelte:fragment>
        </ChatMessage>
      {/if}
    {/each}
    {#if typing}
      <ChatMessage typing typingText="Sam is typing">
        <UserAvatar slot="avatar" size="sm" name="Sam Carter" />
      </ChatMessage>
    {/if}
  </ChatLog>
  <form on:submit|preventDefault={send}>
    <InputGroup>
      <TextArea
        hideLabel
        labelText="Message"
        placeholder="Write a message"
        rows={1}
        grow
        maxRows={4}
        bind:value={draft}
        on:keydown={(event) => {
          // Enter sends; Shift+Enter starts a new line. Skip while an IME
          // is composing, where Enter confirms the text.
          if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
            event.preventDefault();
            send();
          }
        }}
      />
      <Button type="submit" icon={Send} iconDescription="Send" />
    </InputGroup>
  </form>
</Box>
