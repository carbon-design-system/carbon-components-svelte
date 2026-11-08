<script>
  import { Button, focusHandoff, Stack, Tag } from "carbon-components-svelte";

  const all = ["Open", "Assigned to me", "High priority"];
  let filters = [...all];
  let reset;
</script>

<Stack gap={4}>
  <Stack as orientation="horizontal" gap={3} let:props>
    <div
      {...props}
      role="group"
      aria-label="Active filters"
      use:focusHandoff={{
        items: ".bx--tag",
        target: ".bx--tag__close-icon",
        fallback: () => reset,
      }}
    >
      {#each filters as filter (filter)}
        <Tag
          filter
          title="Remove {filter}"
          on:close={() => (filters = filters.filter((f) => f !== filter))}
        >
          {filter}
        </Tag>
      {/each}
    </div>
  </Stack>
  <Button
    bind:ref={reset}
    size="small"
    kind="ghost"
    on:click={() => (filters = [...all])}
  >
    Reset filters
  </Button>
</Stack>
