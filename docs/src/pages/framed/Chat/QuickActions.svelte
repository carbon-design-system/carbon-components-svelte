<script>
  import {
    ChatButton,
    ChatLog,
    ChatMessage,
    Stack,
    UserAvatar,
  } from "carbon-components-svelte";
  import Bot from "carbon-icons-svelte/lib/Bot.svelte";

  const actions = ["Send reminders", "Export as CSV", "Show the oldest"];

  // The chosen reply stays selected, and the others are disabled.
  let chosen;
</script>

<ChatLog labelText="Conversation with the assistant">
  <ChatMessage from="me" author="You">Which invoices are overdue?</ChatMessage>
  <ChatMessage author="Assistant">
    <UserAvatar slot="avatar" size="sm" icon={Bot} backgroundColor="purple" />
    Three invoices are overdue, for $4,200 in total. What would you like to do?
    <Stack slot="attachments" orientation="horizontal" gap={3} wrap="wrap">
      {#each actions as action}
        <ChatButton
          quickAction
          selected={chosen === action}
          disabled={chosen !== undefined && chosen !== action}
          on:click={() => {
            if (!chosen) chosen = action;
          }}
        >
          {action}
        </ChatButton>
      {/each}
    </Stack>
  </ChatMessage>
  {#if chosen}
    <ChatMessage from="me" author="You">{chosen}</ChatMessage>
  {/if}
</ChatLog>
