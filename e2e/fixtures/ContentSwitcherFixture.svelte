<script>
  import { ContentSwitcher, Switch } from "carbon-components-svelte";

  let selectedIndex = 0;
</script>

<ContentSwitcher data-testid="content-switcher" bind:selectedIndex>
  <Switch text="First" selected={true} />
  <Switch text="Second" />
  <Switch text="Third" />
</ContentSwitcher>

<p data-testid="selected-index">Selected: {selectedIndex}</p>
