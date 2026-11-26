<script>
  import {
    Button,
    shortcut,
    ShortcutHelp,
    ShortcutProvider,
  } from "carbon-components-svelte";

  // `?scoped` adds a nested scope, as a side panel would.
  const scoped = new URLSearchParams(location.search).has("scoped");

  let open = false;
  let last = "";
</script>

<ShortcutProvider
  shortcuts={[
    {
      keys: "mod+k",
      label: "Open command palette",
      onTrigger: () => (last = "palette"),
    },
  ]}
>
  <ShortcutHelp bind:open />
  <p data-testid="last">{last}</p>
  <div
    use:shortcut={{
      keys: "mod+s",
      label: "Save draft",
      onTrigger: () => (last = "save"),
    }}
  >
    <Button size="sm">Save draft</Button>
  </div>
  <div
    use:shortcut={{
      keys: "mod+shift+f",
      label: "Filter results",
      onTrigger: () => (last = "filter"),
    }}
  >
    <Button size="sm" kind="secondary">Filter results</Button>
  </div>
  {#if scoped}
    <ShortcutProvider titleText="Edit profile">
      <div
        use:shortcut={{
          keys: "mod+s",
          label: "Save profile",
          onTrigger: () => (last = "save profile"),
        }}
      >
        <Button size="sm" kind="tertiary">Save profile</Button>
      </div>
      <div
        use:shortcut={{
          keys: "alt+arrowright",
          label: "Next section",
          onTrigger: () => (last = "next"),
        }}
      >
        <Button size="sm" kind="ghost">Next section</Button>
      </div>
    </ShortcutProvider>
  {/if}
  <Button kind="ghost" on:click={() => (open = true)}>Show shortcuts</Button>
</ShortcutProvider>
