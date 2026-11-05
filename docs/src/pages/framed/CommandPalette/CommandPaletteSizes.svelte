<script>
  import { Button, CommandPalette, Stack } from "carbon-components-svelte";

  let open = true;
  let size = "md";

  const items = [
    { id: "deploy", text: "Deploy latest commit", shortcut: "mod+shift+d" },
    { id: "restart", text: "Restart service" },
    { id: "logs", text: "View logs", description: "Last 24 hours" },
  ];
</script>

<Stack gap={3} orientation="horizontal">
  {#each ["sm", "md", "lg"] as option (option)}
    <Button
      kind="tertiary"
      on:click={() => {
        size = option;
        open = true;
      }}
    >
      Open {option}
    </Button>
  {/each}
</Stack>

<CommandPalette bind:open {size} {items} />
