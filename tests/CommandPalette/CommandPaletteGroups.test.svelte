<script lang="ts">
  import CommandPalette from "carbon-components-svelte/CommandPalette/CommandPalette.svelte";

  export let value = "";

  const items = [
    { id: "home", text: "Go to dashboard", group: "Navigation" },
    { id: "deploy", text: "Deploy service", group: "Actions" },
    { id: "logs", text: "Open deploy logs", group: "Navigation" },
    { id: "help", text: "Help center" },
  ];
</script>

<CommandPalette open bind:value {items}>
  <strong slot="group" let:group>{group.toUpperCase()}</strong>
</CommandPalette>
