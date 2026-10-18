<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  /** Spies for the per-node `select` and `focus` events. */
  export let onSelect: (detail: unknown) => void = () => {};
  export let onFocus: (detail: unknown) => void = () => {};
  export let virtualize: ComponentProps<TreeView>["virtualize"] = undefined;
  /** Plain rows appended after `nodes`, so windowing is active. */
  export let padding = 0;
  export let nodes: NonNullable<ComponentProps<TreeView>["nodes"]> = [
    { id: "link-1", text: "Link Node", href: "/page-1" },
    { id: "link-2", text: "Another Link", href: "/page-2" },
    { id: "plain-1", text: "Plain Node" },
    {
      id: "link-disabled",
      text: "Disabled Link",
      href: "/disabled",
      target: "_blank",
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
  ];
  export let activeId: ComponentProps<TreeView>["activeId"] = "";
  export let selectedIds: ComponentProps<TreeView>["selectedIds"] = [];

  $: allNodes = [
    ...nodes,
    ...Array.from({ length: padding }, (_, i) => ({
      id: `pad-${i}`,
      text: `Padding ${i}`,
    })),
  ];
</script>

<TreeView
  nodes={allNodes}
  bind:activeId
  bind:selectedIds
  labelText="Link Tree"
  {virtualize}
  on:select={({ detail }) => onSelect(detail)}
  on:focus={({ detail }) => onFocus(detail)}
/>
