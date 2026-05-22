<script>
  import {
    Button,
    ButtonSet,
    filterTreeByText,
    Search,
    Stack,
    Toggle,
    TreeView,
  } from "carbon-components-svelte";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import DocumentBlank from "carbon-icons-svelte/lib/DocumentBlank.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";
  import Html from "carbon-icons-svelte/lib/Html.svelte";
  import Image from "carbon-icons-svelte/lib/Image.svelte";
  import Json from "carbon-icons-svelte/lib/Json.svelte";
  import { onMount, tick } from "svelte";

  function iconFor(name) {
    const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
    if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") {
      return Code;
    }
    if (ext === "json") return Json;
    if (ext === "html") return Html;
    if (ext === "png" || ext === "jpg" || ext === "svg" || ext === "gif") {
      return Image;
    }
    if (ext === "md" || ext === "txt") return Document;
    return DocumentBlank;
  }

  const fileNames = [
    "index.ts",
    "utils.ts",
    "config.json",
    "package.json",
    "styles.scss",
    "theme.css",
    "logo.svg",
    "hero.png",
    "README.md",
    "CHANGELOG.md",
    "App.tsx",
    "Header.tsx",
    "index.html",
    "404.html",
    "robots.txt",
  ];

  let nextId = 0;
  const id = () => nextId++;

  function makeFolder(name, depth, fanout) {
    const node = { id: id(), text: name, icon: Folder, nodes: [] };
    for (let i = 0; i < fanout.files; i++) {
      const fname = fileNames[(i + depth) % fileNames.length];
      node.nodes.push({ id: id(), text: fname, icon: iconFor(fname) });
    }
    if (depth < fanout.maxDepth) {
      for (let i = 0; i < fanout.folders; i++) {
        node.nodes.push(
          makeFolder(`${name}/subfolder-${i}`, depth + 1, fanout),
        );
      }
    }
    return node;
  }

  const rootNames = [
    "src",
    "tests",
    "docs",
    "examples",
    "scripts",
    "node_modules",
    "dist",
    "build",
    "public",
    "static",
    "assets",
    "fixtures",
    "e2e",
    "lib",
    "packages",
    "apps",
    "types",
    "config",
    "tools",
    "plugins",
    "themes",
    "locales",
    "components",
    "hooks",
    "utils",
    "services",
    "pages",
    "layouts",
    "store",
    "api",
    "db",
    "migrations",
    "seeds",
    "internal",
    "integrations",
    "cli",
    "server",
    "client",
    "vendor",
    "workers",
  ];
  const nodes = rootNames.map((name) =>
    makeFolder(name, 0, { files: 8, folders: 4, maxDepth: 4 }),
  );

  function countNodes(list) {
    let n = 0;
    for (const node of list) {
      n++;
      if (node.nodes) n += countNodes(node.nodes);
    }
    return n;
  }
  const totalNodes = countNodes(nodes);

  function allIds(list) {
    const ids = [];
    for (const node of list) {
      ids.push(node.id);
      if (node.nodes) ids.push(...allIds(node.nodes));
    }
    return ids;
  }

  let treeview = null;
  let searchValue = "";
  let compact = false;
  let dynamicHeight = false;

  $: size = compact ? "compact" : "default";

  $: filteredNodes =
    searchValue.trim() === "" ? nodes : filterTreeByText(nodes, searchValue);

  $: if (filteredNodes) {
    tick().then(() => scrollContainerRef?.scrollTo({ top: 0 }));
  }

  let expandedIds = [];
  $: if (searchValue.trim() !== "") {
    expandedIds = allIds(filteredNodes);
  }

  let scrollContainerRef = null;
  let domRowCount = 0;
  let observer = null;

  function attachObserver(el) {
    observer?.disconnect();
    observer = null;
    if (!el) {
      domRowCount = 0;
      return;
    }
    const recount = () => {
      domRowCount = el.querySelectorAll('[role="treeitem"]').length;
    };
    observer = new MutationObserver(recount);
    observer.observe(el, { childList: true });
    recount();
  }

  $: attachObserver(scrollContainerRef);

  onMount(() => () => observer?.disconnect());
</script>

<Stack gap={5}>
  <ButtonSet>
    <Button kind="tertiary" size="small" on:click={() => treeview?.expandAll()}>
      Expand all
    </Button>
    <Button
      kind="tertiary"
      size="small"
      on:click={() => {
        treeview?.collapseAll();
        expandedIds = [];
      }}
    >
      Collapse all
    </Button>
  </ButtonSet>

  <Search
    size="sm"
    placeholder="Filter by file or folder name"
    bind:value={searchValue}
  />

  <Stack gap={3} orientation="horizontal">
    <Toggle
      size="sm"
      labelText="Compact size"
      labelA="Default (32px rows)"
      labelB="Compact (24px rows)"
      bind:toggled={compact}
    />
    <Toggle
      size="sm"
      labelText="Container height"
      labelA="Fixed (480px)"
      labelB="Dynamic (60vh, resize window)"
      bind:toggled={dynamicHeight}
    />
  </Stack>

  <p style:margin="0">
    Total nodes: <strong>{totalNodes.toLocaleString()}</strong>
    {#if searchValue.trim() !== ""}
      &middot; matching filter:
      <strong>{countNodes(filteredNodes).toLocaleString()}</strong>
    {/if}
    &middot; rendered in DOM: <strong>{domRowCount.toLocaleString()}</strong>
  </p>

  {#if filteredNodes.length > 0}
    {#if dynamicHeight}
      <!-- A constrained parent gives `containerHeight: "100%"` something to
           resolve against. Resize the browser to watch the DOM count change. -->
      <div style="height: 60vh; min-height: 240px;">
        <TreeView
          bind:this={treeview}
          bind:scrollContainerRef
          labelText="Project files"
          nodes={filteredNodes}
          bind:expandedIds
          {size}
          virtualize={{ containerHeight: "100%" }}
          let:node
        >
          {node.text}
        </TreeView>
      </div>
    {:else}
      <TreeView
        bind:this={treeview}
        bind:scrollContainerRef
        labelText="Project files"
        nodes={filteredNodes}
        bind:expandedIds
        {size}
        virtualize={{ containerHeight: 480 }}
        let:node
      >
        {node.text}
      </TreeView>
    {/if}
  {:else}
    <p>No files match "{searchValue}".</p>
  {/if}
</Stack>
