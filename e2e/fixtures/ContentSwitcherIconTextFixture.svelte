<script>
  import { ContentSwitcher, Switch } from "carbon-components-svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";
  import TableOfContents from "carbon-icons-svelte/lib/TableOfContents.svelte";

  const variants = [
    { id: "default", props: {} },
    { id: "low-contrast", props: { lowContrast: true } },
    { id: "sm", props: { size: "sm" } },
    { id: "xl", props: { size: "xl" } },
  ];
</script>

{#each variants as { id, props } (id)}
  <div style="margin-bottom: 1rem">
    <ContentSwitcher data-testid={id} {...props}>
      <Switch><TableOfContents /> Table of contents</Switch>
      <Switch><Dashboard /> Dashboard</Switch>
      <Switch disabled><List /> List</Switch>
    </ContentSwitcher>
  </div>
{/each}

<div style="width: 16rem">
  <ContentSwitcher data-testid="narrow">
    <Switch><TableOfContents /> Table of contents</Switch>
    <Switch><Dashboard /> Dashboard</Switch>
  </ContentSwitcher>
</div>
