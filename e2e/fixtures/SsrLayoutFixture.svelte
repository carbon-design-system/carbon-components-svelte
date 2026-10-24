<script>
  import {
    ContentSwitcher,
    ExpandableTile,
    OverflowMenu,
    OverflowMenuItem,
    Switch,
  } from "carbon-components-svelte";
  import Grid from "carbon-icons-svelte/lib/Grid.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";
</script>

<div data-testid="switcher" style="width: 20rem; padding: 1rem;">
  <ContentSwitcher>
    <Switch text="Grid" icon={Grid} />
    <Switch text="List" icon={List} />
  </ContentSwitcher>
</div>

<div data-testid="tile" style="width: 14rem; padding: 1rem;">
  <ExpandableTile>
    <div slot="above">Storage</div>
    <div slot="below">2.4 TB of 5 TB used across 12 buckets.</div>
  </ExpandableTile>
</div>

<div
  data-testid="menu"
  style="position: relative; height: 10rem; padding: 1rem;"
>
  <OverflowMenu open iconDescription="More">
    <OverflowMenuItem text="Edit" />
    <OverflowMenuItem text="Delete" />
  </OverflowMenu>
</div>
