<script>
  import {
    Button,
    CommandPalette,
    LayoutDirection,
  } from "carbon-components-svelte";
  import Rocket from "carbon-icons-svelte/lib/Rocket.svelte";

  const params = new URLSearchParams(location.search);
  const dir = params.has("rtl") ? "rtl" : "ltr";
  const items = params.has("large")
    ? Array.from({ length: 1000 }, (_, index) => ({
        id: index,
        text: `service-${index}`,
      }))
    : [
        {
          id: "deploy",
          text: "Deploy service",
          icon: Rocket,
          shortcut: "mod+d",
        },
        { id: "restart", text: "Restart service" },
        { id: "logs", text: "View logs" },
      ];

  let open = params.has("open");
  let selected = "";
</script>

<LayoutDirection {dir}>
  <Button data-testid="trigger" on:click={() => (open = true)}>Open</Button>
  <span data-testid="selected">{selected}</span>
  <CommandPalette
    bind:open
    {items}
    on:select={(event) => (selected = event.detail.item.text)}
  />
</LayoutDirection>
