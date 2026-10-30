<script>
  import {
    Button,
    CommandPalette,
    LayoutDirection,
    Modal,
  } from "carbon-components-svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import Renew from "carbon-icons-svelte/lib/Renew.svelte";
  import Rocket from "carbon-icons-svelte/lib/Rocket.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  const params = new URLSearchParams(location.search);
  const dir = params.has("rtl") ? "rtl" : "ltr";
  const state = params.get("state") ?? "";

  const basic = [
    {
      id: "deploy",
      text: "Deploy service",
      icon: Rocket,
      shortcut: "mod+d",
    },
    { id: "restart", text: "Restart service" },
    { id: "logs", text: "View logs" },
  ];

  const grouped = [
    {
      id: "deploy",
      text: "Deploy latest commit",
      description: "checkout-api, Oregon",
      icon: Rocket,
      shortcut: "mod+shift+d",
      group: "Actions",
    },
    {
      id: "restart",
      text: "Restart service",
      icon: Renew,
      shortcut: "mod+r",
      group: "Actions",
    },
    {
      id: "delete",
      text: "Delete service",
      icon: TrashCan,
      disabled: true,
      group: "Actions",
    },
    { id: "logs", text: "Logs", group: "Go to", shortcut: "g l" },
    { id: "metrics", text: "Metrics", group: "Go to" },
    { id: "events", text: "Events", group: "Go to" },
    { id: "env", text: "Environment variables", group: "Settings" },
    { id: "domains", text: "Custom domains", group: "Settings" },
    {
      id: "docs",
      text: "Open the docs",
      icon: Launch,
      href: "#docs",
      group: "Help",
    },
  ];

  const long = [
    {
      id: "long-1",
      text: "Roll back checkout-api-production-oregon-blue-green-canary to the previous deploy",
      description:
        "Deploy dep-cqv8mf0r8ii7f7hc5n0g from 2026-10-29 14:02 UTC, commit 9f3c2e1 (Update the payment retry budget for European card networks)",
      shortcut: "mod+alt+shift+r",
    },
    {
      id: "long-2",
      text: "https://dashboard.example.com/workspaces/acme-production/services/checkout-api/settings/environment",
      icon: Launch,
    },
    { id: "short", text: "View logs" },
  ];

  const large = Array.from({ length: 1000 }, (_, index) => ({
    id: index,
    text: `service-${index}`,
  }));

  const sets = {
    "": basic,
    one: [basic[0]],
    empty: [],
    groups: grouped,
    long,
    loading: [],
    "loading-more": basic,
    noresults: grouped,
  };

  const items = params.has("large") ? large : (sets[state] ?? basic);

  let open = params.has("open");
  let modalOpen = params.has("modal");
  let value = params.get("query") ?? (state === "noresults" ? "zzzz" : "");
  let selected = "";
  // The palette renders before the page's modals, as in an app shell.
  const first = params.has("first");
</script>

<LayoutDirection {dir}>
  <Button data-testid="trigger" on:click={() => (open = true)}>Open</Button>
  <span data-testid="selected">{selected}</span>
  {#if first}
    <CommandPalette
      bind:open
      bind:value
      {items}
      on:select={(event) => (selected = String(event.detail.id))}
    />
  {/if}
  {#if params.has("modal")}
    <Modal
      bind:open={modalOpen}
      modalHeading="Service settings"
      primaryButtonText="Save"
      secondaryButtonText="Cancel"
    >
      <Button data-testid="modal-trigger" on:click={() => (open = true)}>
        Open command palette
      </Button>
    </Modal>
  {/if}
  {#if !first}
    <CommandPalette
      bind:open
      bind:value
      {items}
      loading={state === "loading" || state === "loading-more"}
      on:select={(event) => (selected = String(event.detail.id))}
    />
  {/if}
</LayoutDirection>
