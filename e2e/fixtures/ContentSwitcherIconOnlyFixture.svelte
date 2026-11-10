<script>
  import { ContentSwitcher, Switch } from "carbon-components-svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";
  import TableOfContents from "carbon-icons-svelte/lib/TableOfContents.svelte";

  let lastIcon = List;

  const sizes = [
    { id: "default", size: undefined, width: 40 },
    { id: "sm", size: "sm", width: 32 },
    { id: "xl", size: "xl", width: 48 },
  ];
</script>

{#each sizes as { id, size, width } (id)}
  <ContentSwitcher data-testid={id} data-switch-width={width} {size}>
    <Switch text="Table of contents" icon={TableOfContents} />
    <Switch text="Dashboard" icon={Dashboard} />
    <Switch text="List" icon={List} />
  </ContentSwitcher>
{/each}

<ContentSwitcher data-testid="mixed">
  <Switch text="Table of contents" icon={TableOfContents} />
  <Switch text="Dashboard" icon={Dashboard} />
  <Switch text="Plain" />
</ContentSwitcher>

<ContentSwitcher data-testid="toggled">
  <Switch text="Table of contents" icon={TableOfContents} />
  <Switch text="Dashboard" icon={Dashboard} />
  <Switch text="Last" icon={lastIcon} />
</ContentSwitcher>

<button
  type="button"
  data-testid="toggle-icon"
  on:click={() => (lastIcon = lastIcon ? undefined : List)}
>
  Toggle last icon
</button>
