<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let nodes: NonNullable<ComponentProps<TreeView>["nodes"]> = [
    { id: "link-1", text: "Link Node", href: "/page-1" },
    { id: "plain-1", text: "Plain Node" },
    {
      id: "link-disabled",
      text: "Disabled Link",
      href: "/disabled",
      disabled: true,
    },
    {
      id: "link-blank",
      text: "Blank Target",
      href: "/external",
      target: "_blank",
    },
    {
      id: "link-self",
      text: "Self Target",
      href: "/internal",
      target: "_self",
    },
    // Pad so virtualization stays active.
    ...Array.from({ length: 80 }, (_, i) => ({
      id: `pad-${i}`,
      text: `Padding ${i}`,
    })),
  ];
  export let activeId: ComponentProps<TreeView>["activeId"] = "";
  export let selectedIds: ComponentProps<TreeView>["selectedIds"] = [];
</script>

<TreeView
  {nodes}
  bind:activeId
  bind:selectedIds
  labelText="Link Tree"
  virtualize={{ maxVisibleRows: 10 }}
/>
