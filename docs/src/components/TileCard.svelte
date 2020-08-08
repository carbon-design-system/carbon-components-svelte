<script>
  export let title = "";

  import { Tile, Button, ButtonSet } from "carbon-components-svelte";
  import Code16 from "carbon-icons-svelte/lib/Code16";
</script>

<style>
  :global(.tile-card) {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 12rem;
  }

  .title {
    font-size: 0.75rem;
  }

  .tile-card__preview {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 0;
  }

  .tile-card__actions {
    display: flex;
    justify-content: flex-end;
    margin-right: -1rem;
    margin-bottom: -1rem;
  }
</style>

<Tile class="tile-card">
  <div class="title">{title}</div>
  <div class="tile-card__preview">
    <slot />
  </div>
  <div class="tile-card__actions">
    <div>
      <Button
        hasIconOnly
        kind="ghost"
        size="small"
        icon={Code16}
        iconDescription="Usage"
        tooltipAlignment="center"
        tooltipPosition="top" />
      <Button
        hasIconOnly
        kind="ghost"
        size="small"
        icon={Code16}
        iconDescription="Usage"
        tooltipAlignment="center"
        tooltipPosition="top" />
    </div>
  </div>
</Tile>
