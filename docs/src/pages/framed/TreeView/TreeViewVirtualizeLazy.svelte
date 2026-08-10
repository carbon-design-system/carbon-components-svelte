<script>
  import { TreeView } from "carbon-components-svelte";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import DocumentBlank from "carbon-icons-svelte/lib/DocumentBlank.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";
  import Html from "carbon-icons-svelte/lib/Html.svelte";
  import Image from "carbon-icons-svelte/lib/Image.svelte";
  import Json from "carbon-icons-svelte/lib/Json.svelte";

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

  const MAX_DEPTH = 4;
  const FETCH_MS = 500;
  const fanout = { files: 8, folders: 4 };

  let nextId = 0;
  const id = () => nextId++;

  // Roots are unloaded folders; children are fetched on expand.
  let nodes = rootNames.map((name) => ({
    id: id(),
    text: name,
    icon: Folder,
    depth: 0,
    path: name,
    hasChildren: true,
  }));

  function updateNode(list, nodeId, updater) {
    return list.map((node) => {
      if (node.id === nodeId) return updater(node);
      if (node.nodes) {
        return { ...node, nodes: updateNode(node.nodes, nodeId, updater) };
      }
      return node;
    });
  }

  function makeChildren(parentPath, depth) {
    const children = [];
    for (let i = 0; i < fanout.files; i++) {
      const fname = fileNames[(i + depth) % fileNames.length];
      children.push({
        id: id(),
        text: fname,
        icon: iconFor(fname),
        depth: depth + 1,
        path: `${parentPath}/${fname}`,
      });
    }
    if (depth < MAX_DEPTH) {
      for (let i = 0; i < fanout.folders; i++) {
        const name = `subfolder-${i}`;
        children.push({
          id: id(),
          text: name,
          icon: Folder,
          depth: depth + 1,
          path: `${parentPath}/${name}`,
          hasChildren: true,
        });
      }
    }
    return children;
  }

  async function fetchChildren(parentPath, depth) {
    await new Promise((resolve) => setTimeout(resolve, FETCH_MS));
    return makeChildren(parentPath, depth);
  }

  async function handleToggle(event) {
    const node = event.detail;

    // Only fetch once: expandable and not yet loaded (placeholder or real).
    if (!node.hasChildren || node.nodes) return;

    // Virtualized trees do not render the `childNodes` slot. Put a temporary
    // disabled row under the parent so the expand still shows progress.
    nodes = updateNode(nodes, node.id, (n) => ({
      ...n,
      nodes: [
        {
          id: `${n.id}__loading`,
          text: "Loading…",
          disabled: true,
        },
      ],
    }));

    const children = await fetchChildren(
      node.path ?? node.text,
      node.depth ?? 0,
    );
    nodes = updateNode(nodes, node.id, (n) => ({
      ...n,
      nodes: children,
    }));
  }
</script>

<TreeView
  labelText="Project files"
  {nodes}
  virtualize={{ containerHeight: 480 }}
  on:toggle={handleToggle}
  let:node
>
  {node.text}
</TreeView>
