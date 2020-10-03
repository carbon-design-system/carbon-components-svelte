<script>
  export let href = undefined;
  export let title = "";
  export let subtitle = "";
  export let borderRight = false;
  export let borderBottom = false;

  import { ClickableTile, Tile } from "carbon-components-svelte";
  import AspectRatio from "./AspectRatio.svelte";
  import LogoGithub32 from "carbon-icons-svelte/lib/LogoGithub32";
  import Launch20 from "carbon-icons-svelte/lib/Launch20";

  $: tileComponent = href ? ClickableTile : Tile;
</script>

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
    margin-bottom: var(--cds-spacing-01);
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

<div class="card-wrapper" class:borderRight class:borderBottom>
  <AspectRatio>
    <svelte:component
      this="{tileComponent}"
      href="{href}"
      {...$$restProps}
      style="height: 100%;"
    >
      <div class="card">
        <div>
          <h5 class="title">{title}</h5>
          {#if subtitle}
            <div class="subtitle">{subtitle}</div>
          {/if}
        </div>
        <div class="card-footer">
          <svelte:component
            this="{LogoGithub32}"
            style="fill: var(--cds-icon-01)"
          />
          <Launch20 style="fill: var(--cds-icon-01)" />
        </div>
      </div>
    </svelte:component>
  </AspectRatio>
</div>
