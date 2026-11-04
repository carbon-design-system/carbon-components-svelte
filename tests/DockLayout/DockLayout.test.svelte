<script lang="ts">
  import DockLayout from "carbon-components-svelte/DockLayout/DockLayout.svelte";
  import type { DockNode } from "carbon-components-svelte/utils/dock-layout.js";

  export let layout: DockNode = {
    type: "row",
    children: [
      { type: "group", id: "group-1", tabs: ["a", "b"], activeId: "a" },
      { type: "group", id: "group-2", tabs: ["c"], activeId: "c" },
    ],
    sizes: [60, 40],
  };
  export let documents = [
    { id: "a", label: "Alpha" },
    { id: "b", label: "Bravo", modified: true },
    { id: "c", label: "Charlie" },
  ];
  /** Call `preventDefault()` on the cancelable events. */
  export let refuse = false;
  export let onChange: (detail: unknown) => void = () => {};
  export let maximized: string | null = null;
</script>

<DockLayout
  bind:layout
  bind:maximized
  {documents}
  aria-label="Workspace"
  on:layoutchange={(event) => {
    onChange(event.detail);
    if (refuse) event.preventDefault();
  }}
>
  <svelte:fragment slot="panel" let:document>
    {document.label} content
  </svelte:fragment>
</DockLayout>
<pre data-testid="layout">{JSON.stringify(layout)}</pre>
