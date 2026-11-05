<script>
  import CommandPalette from "carbon-components-svelte/CommandPalette/CommandPalette.svelte";

  export let open = true;
  export let value = "";

  const items = [
    {
      id: "deploy",
      text: "Deploy latest commit",
      description: "checkout-api, Oregon",
      shortcut: "mod+shift+d",
      group: "Actions",
    },
    { id: "restart", text: "Restart service", group: "Actions" },
    { id: "delete", text: "Delete service", disabled: true, group: "Actions" },
    { id: "logs", text: "Logs", group: "Go to" },
    { id: "docs", text: "Open the docs", href: "#docs" },
  ];
</script>

<CommandPalette id="palette" {open} {value} {items} />
