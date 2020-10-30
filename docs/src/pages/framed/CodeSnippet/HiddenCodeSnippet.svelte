<script>
  import { CodeSnippet, Tabs, Tab, TabContent } from "carbon-components-svelte";

  let selected = 0;

  const code = Array.from({ length: 20 }, (_, i) => i + 1).join("\n");
</script>

<style>
  p {
    margin-bottom: var(--cds-spacing-05);
  }
</style>

<Tabs bind:selected>
  <Tab label="Tab 1" />
  <Tab label="Tab 2" />
  <div slot="content">
    <TabContent>
      <p>Tab 2 contains a multi-line code snippet.</p>
      <p>
        Inactive tab content is visually hidden but still rendered in the DOM.
        As a result, the "Show more" button will not appear because the computed
        height of the code element is 0.
      </p>
      <p>
        To work around this, you can force the code snippet to be re-rendered
        when the tab content is active.
      </p>
    </TabContent>
    <TabContent>
      <p>The "Show more" button should appear.</p>
      {#if selected === 1}
        <CodeSnippet type="multi" code="{code}" />
      {/if}
    </TabContent>
  </div>
</Tabs>
