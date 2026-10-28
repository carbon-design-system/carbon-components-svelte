<script>
  import { Modal, TreeSelect } from "carbon-components-svelte";

  const regions = [
    {
      id: "eu",
      text: "Europe",
      nodes: [
        {
          id: "de",
          text: "Germany",
          nodes: [
            { id: "berlin", text: "Berlin" },
            { id: "munich", text: "Munich" },
            { id: "hamburg", text: "Hamburg" },
          ],
        },
        {
          id: "fr",
          text: "France",
          nodes: [
            { id: "paris", text: "Paris" },
            { id: "lyon", text: "Lyon" },
          ],
        },
        { id: "is", text: "Iceland", disabled: true },
      ],
    },
    {
      id: "na",
      text: "North America",
      nodes: [
        { id: "us", text: "United States" },
        { id: "ca", text: "Canada" },
      ],
    },
    { id: "an", text: "Antarctica" },
  ];

  const lazyRoots = [
    { id: "cloud", text: "Cloud accounts", hasChildren: true },
    { id: "onprem", text: "On premises", hasChildren: true },
    { id: "edge", text: "Edge" },
  ];

  async function loadChildren(node) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return [1, 2, 3].map((n) => ({
      id: `${node.id}-${n}`,
      text: `${node.text} ${n}`,
      hasChildren: n === 1,
    }));
  }

  const big = Array.from({ length: 10 }, (_, a) => ({
    id: `a${a}`,
    text: `Group ${a}`,
    nodes: Array.from({ length: 10 }, (_, b) => ({
      id: `a${a}-b${b}`,
      text: `Group ${a}.${b}`,
      nodes: Array.from({ length: 49 }, (_, c) => ({
        id: `a${a}-b${b}-c${c}`,
        text: `Leaf ${a}.${b}.${c}`,
      })),
    })),
  }));

  // Group 0 open down to its leaves: 610 rows, so the menu windows.
  const bigExpanded = [
    "a0",
    ...Array.from({ length: 10 }, (_, b) => `a0-b${b}`),
  ];
  let singleId = "munich";
  let multiIds = ["fr"];
  let tagIds = ["de", "us"];
  let modalOpen = false;
  let modalIds = [];
  let bigIds = [];
  let bigSingle;
  let events = [];
  const log = (name) => () => {
    events = [...events, name];
  };
</script>

<div id="host" style="max-width: 24rem; padding: 1rem">
  <div data-testid="single">
    <TreeSelect
      labelText="Single"
      label="Choose a location"
      nodes={regions}
      bind:selectedId={singleId}
      clearable
      on:select={log("select")}
      on:open={log("open")}
      on:close={log("close")}
    />
  </div>
  <p data-testid="single-value">{singleId ?? "none"}</p>
  <p data-testid="events">{events.join(",")}</p>

  <div data-testid="single-search">
    <TreeSelect
      labelText="Single search"
      placeholder="Search locations"
      nodes={regions}
      filterable
    />
  </div>

  <div data-testid="multi">
    <TreeSelect
      labelText="Multi"
      label="Choose locations"
      nodes={regions}
      selectionMode="checkbox"
      bind:checkedIds={multiIds}
      expandedIds={["eu"]}
    />
  </div>
  <p data-testid="multi-value">{multiIds.join(",")}</p>

  <div data-testid="tags">
    <TreeSelect
      labelText="Tags"
      label="Choose locations"
      nodes={regions}
      selectionMode="checkbox"
      selectionDisplay="tags"
      showChecked="leaf"
      bind:checkedIds={tagIds}
    />
  </div>

  <div data-testid="multi-search">
    <TreeSelect
      labelText="Multi search"
      placeholder="Search locations"
      nodes={regions}
      selectionMode="checkbox"
      filterable
    />
  </div>

  <div data-testid="lazy">
    <TreeSelect
      labelText="Lazy"
      label="Choose an account"
      nodes={lazyRoots}
      {loadChildren}
    />
  </div>

  <div data-testid="big">
    <TreeSelect
      labelText="Big"
      placeholder="Search 5,000 nodes"
      nodes={big}
      selectionMode="checkbox"
      bind:checkedIds={bigIds}
      filterable
    />
  </div>
  <p data-testid="big-count">{bigIds.length}</p>

  <div data-testid="big-single">
    <TreeSelect
      labelText="Big single"
      label="5,000 nodes"
      nodes={big}
      bind:selectedId={bigSingle}
      expandedIds={bigExpanded}
    />
  </div>

  <button
    type="button"
    data-testid="open-modal"
    on:click={() => (modalOpen = true)}
  >
    Open modal
  </button>
  <Modal
    bind:open={modalOpen}
    modalHeading="Pick locations"
    primaryButtonText="Done"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (modalOpen = false)}
    on:submit={() => (modalOpen = false)}
  >
    <div data-testid="in-modal">
      <TreeSelect
        labelText="In a modal"
        label="Choose locations"
        nodes={regions}
        selectionMode="checkbox"
        bind:checkedIds={modalIds}
      />
    </div>
  </Modal>
</div>
