<script>
  import { Button, CommandPalette, Stack } from "carbon-components-svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Restart from "carbon-icons-svelte/lib/Restart.svelte";
  import Rocket from "carbon-icons-svelte/lib/Rocket.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
  import Undo from "carbon-icons-svelte/lib/Undo.svelte";
  import UserMultiple from "carbon-icons-svelte/lib/UserMultiple.svelte";

  let open = true;
  let lastRun = "";

  const items = [
    { id: "dashboard", text: "Go to dashboard", icon: Dashboard },
    {
      id: "deploy",
      text: "Deploy latest commit",
      icon: Rocket,
      shortcut: "mod+shift+d",
    },
    { id: "restart", text: "Restart service", icon: Restart },
    {
      id: "rollback",
      text: "Roll back to previous deploy",
      icon: Undo,
      keywords: ["revert", "undo"],
    },
    {
      id: "env",
      text: "Edit environment variables",
      description: "Variables and secret files for checkout-api",
      icon: Settings,
    },
    {
      id: "team",
      text: "Manage team members",
      icon: UserMultiple,
      shortcut: "mod+shift+m",
    },
  ];
</script>

<Stack gap={5}>
  <Button on:click={() => (open = true)}>Open command palette</Button>
  {#if lastRun}
    <p>Ran: {lastRun}</p>
  {/if}
</Stack>

<CommandPalette
  bind:open
  {items}
  on:select={(event) => (lastRun = event.detail.item.text)}
/>
