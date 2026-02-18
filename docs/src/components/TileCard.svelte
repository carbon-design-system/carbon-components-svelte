<script>
  export let href = undefined;
  export let title = "";
  export let subtitle = "";
  export let borderRight = false;
  export let borderBottom = false;

  import { AspectRatio, ClickableTile, Stack, Tile } from "carbon-components-svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";

  $: tileComponent = href ? ClickableTile : Tile;
</script>

<div class="card-wrapper" class:borderRight class:borderBottom>
  <AspectRatio>
    <svelte:component
      this={tileComponent}
      {href}
      {...$$restProps}
      style="height: 100%;"
    >
      <div class="card">
        <Stack gap={1}>
          <h5 class="title">{title}</h5>
          {#if subtitle}
            <div class="subtitle">{subtitle}</div>
          {/if}
        </Stack>
        <div class="card-footer">
          <svelte:component
            this={LogoGithub}
            size={32}
            style="fill: var(--cds-icon-01)"
          />
          <Launch size={20} style="fill: var(--cds-icon-01)" />
        </div>
      </div>
    </svelte:component>
  </AspectRatio>
</div>

<style>
  .card-wrapper {
    border-right: 1px solid transparent;
    border-bottom: 1px solid transparent;
  }

  .borderRight {
    border-right: 1px solid var(--cds-ui-03);
  }

  .borderBottom {
    border-bottom: 1px solid var(--cds-ui-03);
  }

  .card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  .card-footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  .title {
    margin-top: calc(-1 * var(--cds-spacing-02));
  }

  .subtitle {
    color: var(--cds-text-02);
  }

  @media (max-width: 671px) {
    .card-wrapper,
    .borderRight {
      border-right: 0;
      border-bottom: 1px solid var(--cds-ui-03);
    }
  }
</style>
