<script lang="ts">
  import CommandPalette from "carbon-components-svelte/CommandPalette/CommandPalette.svelte";

  export let value = "";

  const items = [
    { id: "deploy", text: "Deploy service" },
    { id: "logs", text: "View logs" },
  ];
</script>

<CommandPalette open bind:value {items} let:item let:segments let:highlighted>
  <span data-testid="row-{item.id}" data-highlighted={highlighted}
    >{#each segments as segment}
      {#if segment.match}
        <u>{segment.text}</u>
      {:else}
        {segment.text}
      {/if}
    {/each}</span
  >
  <p slot="noResults" let:value>Nothing for {value}</p>
  <span slot="footer">Press Enter to run</span>
</CommandPalette>
