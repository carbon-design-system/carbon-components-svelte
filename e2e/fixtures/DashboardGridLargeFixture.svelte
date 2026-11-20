<script>
  import { DashboardGrid, DashboardGridItem } from "carbon-components-svelte";

  const COUNT = 50;
  const ids = Array.from({ length: COUNT }, (_, n) => `w${n + 1}`);

  let layouts = {
    lg: ids.map((id, n) => ({
      id,
      x: (n % 4) * 4,
      y: Math.floor(n / 4) * 2,
      w: 4,
      h: 2,
    })),
  };
  let changes = 0;
</script>

<main>
  <DashboardGrid
    bind:layouts
    aria-label="Fifty widgets"
    data-testid="grid"
    on:layoutchange={() => (changes += 1)}
  >
    {#each ids as id (id)}
      <DashboardGridItem {id} titleText={`Widget ${id.slice(1)}`}>
        <p>{id}</p>
      </DashboardGridItem>
    {/each}
  </DashboardGrid>
  <span data-testid="changes">{changes}</span>
  <pre data-testid="layouts">{JSON.stringify(layouts)}</pre>
</main>

<style>
  main {
    padding: 1rem;
  }

  pre {
    max-width: 100%;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
