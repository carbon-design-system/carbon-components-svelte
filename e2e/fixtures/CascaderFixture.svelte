<script>
  import { Cascader, Modal } from "carbon-components-svelte";

  const params = new URLSearchParams(window.location.search);
  const latency = Number(params.get("latency") ?? 250);

  const places = [
    {
      id: "eu",
      text: "Europe",
      nodes: [
        {
          id: "fr",
          text: "France",
          nodes: [
            { id: "paris", text: "Paris" },
            { id: "lyon", text: "Lyon" },
            { id: "nice", text: "Nice" },
          ],
        },
        {
          id: "de",
          text: "Germany",
          nodes: [
            { id: "berlin", text: "Berlin" },
            { id: "munich", text: "Munich" },
          ],
        },
        { id: "is", text: "Iceland", disabled: true },
      ],
    },
    {
      id: "na",
      text: "North America",
      nodes: [
        {
          id: "us",
          text: "United States",
          nodes: [
            { id: "nyc", text: "New York" },
            { id: "sf", text: "San Francisco" },
          ],
        },
        { id: "ca", text: "Canada", nodes: [{ id: "tor", text: "Toronto" }] },
      ],
    },
    { id: "an", text: "Antarctica" },
  ];

  const orgRoots = [
    { id: "eng", text: "Engineering", hasChildren: true },
    { id: "sales", text: "Sales", hasChildren: true },
    { id: "legal", text: "Legal" },
  ];

  async function loadOrg(node, { signal }) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, latency);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
    if (node.id === "sales") throw new Error("Sales is offline");
    return [1, 2, 3].map((n) => ({
      id: `${node.id}-${n}`,
      text: `${node.text} team ${n}`,
      hasChildren: n === 1,
    }));
  }

  // 4 levels of 50, made on demand: 50^4 nodes would not fit in memory.
  const wide = Array.from({ length: 50 }, (_, i) => ({
    id: `l1-${i}`,
    text: `Level 1 item ${i}`,
    hasChildren: true,
  }));

  async function loadWide(node, { signal, path }) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, latency);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
    const depth = path.length + 1;
    return Array.from({ length: 50 }, (_, i) => ({
      id: `${node.id}.${i}`,
      text: `Level ${depth} item ${i}`,
      hasChildren: depth < 4,
    }));
  }

  // 50 x 50 x 50 = 125,000 leaves, all in memory.
  const big = Array.from({ length: 50 }, (_, a) => ({
    id: `a${a}`,
    text: `Group ${a}`,
    nodes: Array.from({ length: 50 }, (_, b) => ({
      id: `b${b}`,
      text: `Section ${a}.${b}`,
      nodes: Array.from({ length: 50 }, (_, c) => ({
        id: `c${c}`,
        text: `Item ${a}.${b}.${c}`,
      })),
    })),
  }));

  let single = [];
  let multi = [];
  let lazy = [];
  let lazyOpen = false;
  let modalOpen = false;
  let modalValue = [];
  let changes = [];
</script>

<main style="padding: 1rem; max-width: 40rem;">
  <div style="min-height: 8rem">
    <Cascader
      id="single"
      labelText="Location"
      label="Choose a city"
      nodes={places}
      bind:value={single}
      clearable
      layout="columns"
      helperText="Region, country, city"
      on:change={(event) => (changes = [...changes, event.detail])}
    />
  </div>
  <p data-testid="single-value">{JSON.stringify(single)}</p>
  <p data-testid="change-count">{changes.length}</p>

  <div style="min-height: 8rem">
    <Cascader
      id="multi"
      labelText="Locations"
      label="Choose cities"
      multiple
      nodes={places}
      bind:values={multi}
      layout="columns"
    />
  </div>
  <p data-testid="multi-value">{JSON.stringify(multi)}</p>

  <div style="min-height: 8rem">
    <Cascader
      id="search"
      labelText="Find a city"
      placeholder="Search"
      filterable
      nodes={places}
      layout="columns"
    />
  </div>

  <div style="min-height: 8rem">
    <Cascader
      id="change-on-select"
      labelText="Any level"
      label="Choose a place"
      changeOnSelect
      nodes={places}
      layout="columns"
    />
  </div>

  <div style="min-height: 8rem">
    <Cascader
      id="lazy"
      labelText="Team"
      label="Choose a team"
      nodes={orgRoots}
      loadChildren={loadOrg}
      bind:value={lazy}
      bind:open={lazyOpen}
      layout="columns"
    />
  </div>
  <p data-testid="lazy-value">{JSON.stringify(lazy)}</p>

  <div style="min-height: 8rem">
    <Cascader
      id="wide"
      labelText="Wide, lazy"
      label="Choose an item"
      nodes={wide}
      loadChildren={loadWide}
      layout="columns"
    />
  </div>

  <div style="min-height: 8rem">
    <Cascader
      id="big"
      labelText="Big, in memory"
      label="Choose an item"
      filterable
      nodes={big}
      layout="columns"
    />
  </div>

  <div style="min-height: 8rem">
    <Cascader
      id="big-multi"
      labelText="Big, in memory, many"
      label="Choose items"
      multiple
      nodes={big}
      layout="columns"
    />
  </div>

  <div style="min-height: 8rem">
    <Cascader
      id="drill"
      labelText="Drill in"
      label="Choose a city"
      nodes={places}
      layout="drill-in"
    />
  </div>

  <div style="min-height: 8rem">
    <Cascader
      id="auto"
      labelText="Automatic"
      label="Choose a city"
      nodes={places}
    />
  </div>

  <button type="button" on:click={() => (modalOpen = true)}>Open modal</button>
  <Modal bind:open={modalOpen} modalHeading="Pick" passiveModal>
    <Cascader
      id="in-modal"
      labelText="In a modal"
      label="Choose a city"
      nodes={places}
      bind:value={modalValue}
      layout="columns"
    />
  </Modal>
</main>
