<script>
  import {
    Content,
    Header,
    HeaderSwitcher,
    LocalStorage,
    ProfileMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";

  // `?detail` shows the current-account block; `?threshold=N` sets
  // `searchThreshold`; `?recent` lists recent accounts, kept in `LocalStorage`.
  const params = new URLSearchParams(location.search);
  const showDetail = params.has("detail");
  const searchThreshold = Number(params.get("threshold") ?? 8);
  const recent = params.has("recent");

  const items = [
    {
      id: "acme",
      text: "Acme Corp",
      description: "Engineering",
      group: "Accounts",
    },
    {
      id: "globex",
      text: "Globex Industries",
      description: "Sales",
      group: "Accounts",
    },
    {
      id: "initech",
      text: "Initech",
      description: "Platform",
      group: "Accounts",
    },
    {
      id: "initrode",
      text: "Initrode",
      description: "Finance",
      group: "Accounts",
    },
    {
      id: "umbrella",
      text: "Umbrella Regional Distribution & Logistics Cooperative",
      description: "Operations",
      group: "Accounts",
    },
    { id: "hooli", text: "Hooli", description: "Search", group: "Accounts" },
    {
      id: "zoe",
      text: "Zoë Personal",
      description: "zoe@example.com",
      group: "Accounts",
    },
    { id: "console", text: "Cloud console", group: "Apps", href: "#console" },
    { id: "billing", text: "Billing", group: "Apps", href: "#billing" },
    { id: "gitops", text: "GitOps", group: "Apps", href: "#gitops" },
  ];

  let selectedId = "acme";
  let recentIds = recent ? [] : undefined;
  let isOpen = true;
  let last = "";
</script>

{#if recent}
  <LocalStorage key="e2e-switcher-recent" bind:value={recentIds} />
{/if}
<Header companyName="E2E" platformName="Switcher items">
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderSwitcher
    {items}
    {showDetail}
    {searchThreshold}
    bind:selectedId
    bind:recentIds
    bind:isOpen
    on:select={(event) => (last = String(event.detail.selectedId))}
  >
    <ProfileMenuItem>Create workspace</ProfileMenuItem>
  </HeaderSwitcher>
</Header>
<Content>
  <p id="selected">{selectedId}</p>
  <p id="last">{last}</p>
</Content>
