<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Search from "carbon-icons-svelte/lib/Search.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let open = false;
  let maxWidth = "md";
</script>

<Button on:click={() => { maxWidth = "sm"; open = true; }}
  >Small (384px)</Button
>
<Button on:click={() => { maxWidth = "md"; open = true; }}
  >Medium (640px)</Button
>
<Button on:click={() => { maxWidth = "lg"; open = true; }}
  >Large (768px)</Button
>
<Button on:click={() => { maxWidth = "xl"; open = true; }}
  >Extra large (1024px)</Button
>

<CommandPalette bind:open {maxWidth} triggerKeys={[]}>
  <CommandPaletteItem
    id="home"
    text="Go to Dashboard"
    description="Overview of your workspace"
    icon={Dashboard}
  />
  <CommandPaletteItem
    id="search"
    text="Search documents"
    description="Find files across your organization"
    icon={Search}
  />
  <CommandPaletteItem
    id="settings"
    text="Open settings"
    description="Manage preferences and integrations"
    icon={Settings}
  />
</CommandPalette>
