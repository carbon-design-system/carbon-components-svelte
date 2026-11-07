<script>
  import { Button, focusHandoff, Stack } from "carbon-components-svelte";

  let rows = ["Alpha", "Bravo", "Charlie", "Delta"];
</script>

<ul tabindex="-1" aria-label="Services" use:focusHandoff={{ items: "li" }}>
  {#each rows as row (row)}
    <li>
      <Stack as orientation="horizontal" gap={3} let:props>
        <span {...props}>{row}</span>
        <Button
          size="small"
          kind="danger-ghost"
          on:click={() => (rows = rows.filter((r) => r !== row))}
        >
          Delete {row}
        </Button>
      </Stack>
    </li>
  {/each}
</ul>
