<script>
  import {
    Tab,
    TabContent,
    Tabs,
    TabsVertical,
  } from "carbon-components-svelte";

  const params = new URLSearchParams(location.search);
  const dir = params.get("dir");
  // `?vertical` renders the row layout of `TabsVertical`, which shares the
  // overflow buttons.
  const component = params.has("vertical") ? TabsVertical : Tabs;
  const props = params.has("vertical") ? { orientation: "horizontal" } : {};

  const items = Array.from({ length: 10 }, (_, i) => `Tab label ${i + 1}`);
</script>

<!-- Constrain the width so the list overflows regardless of the viewport. -->
<div style="inline-size: 320px;" {dir} data-testid="tabs-overflow">
  <svelte:component this={component} {...props}>
    {#each items as item}
      <Tab label={item} />
    {/each}
    <svelte:fragment slot="content">
      {#each items as item}
        <TabContent>{item} content</TabContent>
      {/each}
    </svelte:fragment>
  </svelte:component>
</div>
