<script lang="ts">
  import { TreeView } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let nodes: ComponentProps<TreeView>["nodes"] = [
    { id: "link-1", text: "Link Node", href: "/page-1" },
    { id: "link-2", text: "Another Link", href: "/page-2" },
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
  ];
  export let activeId: ComponentProps<TreeView>["activeId"] = "";
  export let selectedIds: ComponentProps<TreeView>["selectedIds"] = [];
</script>

<TreeView
  {nodes}
  bind:activeId
  bind:selectedIds
  labelText="Link Tree"
  on:select={({ detail }) => console.log("select", detail)}
  on:focus={({ detail }) => console.log("focus", detail)}
/>
