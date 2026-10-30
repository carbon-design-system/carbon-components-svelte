<script>
  import {
    Button,
    CommandPalette,
    formatShortcut,
    onShortcut,
    Stack,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let open = true;

  const items = [
    { id: "deploy", text: "Deploy latest commit", shortcut: "mod+shift+d" },
    { id: "logs", text: "View logs", shortcut: "mod+l" },
    { id: "settings", text: "Open settings", shortcut: "mod+," },
    { id: "search", text: "Search services", shortcut: "/" },
    { id: "help", text: "Show keyboard shortcuts", shortcut: "shift+?" },
  ];

  onMount(() => onShortcut("mod+k", () => (open = !open)));
</script>

<Stack gap={5}>
  <Button on:click={() => (open = true)}>Open command palette</Button>
  <p>Or press {formatShortcut("mod+k").join(" ")} anywhere on the page.</p>
</Stack>

<CommandPalette bind:open {items} />
