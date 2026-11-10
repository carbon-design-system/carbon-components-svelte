<script>
  import {
    Button,
    createTipStore,
    Guidebanner,
    InlineTip,
    setTipStore,
  } from "carbon-components-svelte";

  const store = createTipStore();
  setTipStore(store);

  const tips = [
    {
      id: "filters",
      title: "Filter by owner",
      text: "Narrow the table to the rows one person owns.",
      href: "#filters",
    },
    {
      id: "export",
      title: "Export a view",
      text: "Save the table as a CSV file, with the filters you set.",
    },
    {
      id: "share",
      title: "Share a view",
      text: "Copy a link that opens this table with the same filters.",
      href: "#share",
    },
  ];

  const many = Array.from({ length: 20 }, (_, index) => ({
    id: `many-${index + 1}`,
    title: `Tip ${index + 1}`,
    text: `The text of tip number ${index + 1}.`,
  }));
</script>

<div style:max-width="640px" style:padding="1rem">
  <div style:display="grid" style:row-gap="1rem">
    <InlineTip
      data-testid="tip"
      id="settings-sync"
      title="Sync your settings"
      href="#sync"
    >
      Keep your layout, filters and theme on every device you sign in to.
      <svelte:fragment slot="actions">
        <Button kind="tertiary" size="sm">Turn on sync</Button>
      </svelte:fragment>
    </InlineTip>

    <InlineTip
      data-testid="collapsible"
      id="shortcuts"
      title="Work faster with keyboard shortcuts"
      collapsible
    >
      Press the question mark key anywhere on the page to see every shortcut for
      the view you are on.
      <svg
        slot="illustration"
        data-testid="art"
        width="96"
        height="64"
        viewBox="0 0 96 64"
        style:fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <rect x="2" y="2" width="92" height="60" rx="4" />
        <rect x="12" y="14" width="16" height="16" />
        <rect x="34" y="14" width="16" height="16" />
        <rect x="56" y="14" width="16" height="16" />
        <rect x="12" y="38" width="60" height="12" />
      </svg>
    </InlineTip>

    <Guidebanner data-testid="banner" id="banner" {tips} />

    <Guidebanner
      data-testid="banner-many"
      id="banner-many"
      labelText="Many tips"
      tips={many}
    />

    <div>
      <Button
        data-testid="reset"
        kind="ghost"
        size="sm"
        on:click={() => store.reset()}
      >
        Show tips again
      </Button>
    </div>
  </div>
</div>
