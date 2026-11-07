<script lang="ts">
  import HeaderSwitcher from "carbon-components-svelte/UIShell/HeaderSwitcher.svelte";
  import ProfileMenuItem from "carbon-components-svelte/UIShell/ProfileMenuItem.svelte";

  export let selectedId: string | undefined = "acme";
  export let searchThreshold = 3;
  export let showDetail = false;
  export let recentIds: string[] | undefined = undefined;
  export let onSelect: (e: CustomEvent) => void = () => {};
  export let onFilter: (e: CustomEvent) => void = () => {};

  const items = [
    {
      id: "acme",
      text: "Acme Corp",
      description: "Engineering",
      group: "Accounts",
    },
    { id: "globex", text: "Globex", group: "Accounts" },
    { id: "zoe", text: "Zoë Personal", group: "Accounts" },
    { id: "console", text: "Cloud console", group: "Apps", href: "#console" },
  ];
</script>

<HeaderSwitcher
  isOpen
  {items}
  {searchThreshold}
  {showDetail}
  bind:selectedId
  bind:recentIds
  on:select={onSelect}
  on:filter={onFilter}
>
  <ProfileMenuItem>Create workspace</ProfileMenuItem>
</HeaderSwitcher>
<p data-testid="selected">{selectedId}</p>
<p data-testid="recent">{JSON.stringify(recentIds)}</p>
