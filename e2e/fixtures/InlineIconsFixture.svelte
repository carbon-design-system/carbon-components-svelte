<script lang="ts">
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import Card from "carbon-components-svelte/Card/Card.svelte";
  import CardHeader from "carbon-components-svelte/Card/CardHeader.svelte";
  import CardTitle from "carbon-components-svelte/Card/CardTitle.svelte";
  import ConfirmModal from "carbon-components-svelte/ConfirmModal/ConfirmModal.svelte";
  import Kbd from "carbon-components-svelte/Kbd/Kbd.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
</script>

<main>
  <p data-testid="kbd">Press <Kbd shortcut="mod+k" /> to search.</p>
  <p data-testid="kbd-sm">
    Press <Kbd size="sm" shortcut="mod+k" /> to search.
  </p>
  <p data-testid="kbd-muted">
    Press <Kbd variant="muted" shortcut="mod+k" /> to search.
  </p>
  {#each ["mini", "2xs", "xs"] as const as size}
    <p data-testid="ai-label-{size}">
      Summary by <AILabel {size} /> from your notes.
    </p>
  {/each}
  <p data-testid="ai-label-inline">
    Summary by <AILabel variant="inline" size="lg" /> from your notes.
  </p>
  {#each ["productive", "expressive"] as const as density}
    <Card data-testid="card-{density}" {density}>
      <CardHeader>
        <CardTitle>Quarterly report<Launch slot="titleEnd" /></CardTitle>
      </CardHeader>
    </Card>
  {/each}
  <ConfirmModal open kind="warning" title="Delete Postgres 14" />
</main>
