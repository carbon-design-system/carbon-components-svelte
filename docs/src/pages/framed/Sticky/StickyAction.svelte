<script>
  import { Search, sticky, Tag } from "carbon-components-svelte";

  let stuck = false;

  const icons = Array.from({ length: 200 }, (_, index) => `Icon ${index + 1}`);
</script>

<div
  class="gallery-bar"
  class:gallery-bar--stuck={stuck}
  use:sticky={{ onChange: (value) => (stuck = value) }}
>
  <Search labelText="Filter icons" placeholder="Filter icons" />
</div>
{#each icons as icon (icon)}
  <Tag>{icon}</Tag>
{/each}

<style>
  .gallery-bar {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--cds-background);
  }

  .gallery-bar--stuck {
    box-shadow: 0 2px 6px var(--cds-shadow);
  }
</style>
