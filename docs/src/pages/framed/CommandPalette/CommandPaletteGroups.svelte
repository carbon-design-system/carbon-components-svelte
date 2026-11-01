<script>
  import { Button, CommandPalette } from "carbon-components-svelte";

  let open = true;

  const items = [
    { id: "dashboard", text: "Go to dashboard", group: "Navigation" },
    { id: "services", text: "Go to services", group: "Navigation" },
    { id: "billing", text: "Go to billing", group: "Navigation" },
    { id: "deploy", text: "Deploy latest commit", group: "Service" },
    { id: "restart", text: "Restart service", group: "Service" },
    { id: "scale", text: "Scale instances", group: "Service" },
    { id: "theme", text: "Toggle dark theme", group: "Preferences" },
    { id: "shortcuts", text: "Show keyboard shortcuts", group: "Preferences" },
  ];
</script>

<Button on:click={() => (open = true)}>Open command palette</Button>

<CommandPalette bind:open {items} value="go" />
