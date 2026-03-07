<script>
  import { ContentSwitcher, Switch } from "carbon-components-svelte";

  let selectedIndex = 0;
</script>

<div class="fixture-container">
  <ContentSwitcher
    data-testid="content-switcher"
    bind:selectedIndex
  >
    <Switch text="First" selected={true} />
    <Switch text="Second" />
    <Switch text="Third" />
  </ContentSwitcher>

  <p data-testid="selected-index">Selected: {selectedIndex}</p>
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
