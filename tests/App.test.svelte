<script lang="ts">
  import { TreeView as TreeViewNav } from "carbon-components-svelte";
  import AspectRatio from "./AspectRatio/AspectRatio.test.svelte";
  import Accordion from "./Accordion/Accordion.test.svelte";
  import AccordionProgrammatic from "./Accordion/Accordion.programmatic.test.svelte";
  import AccordionDisabled from "./Accordion/Accordion.disabled.test.svelte";
  import DuplicateDataTables from "./DataTable/DuplicateDataTables.test.svelte";
  import TreeView from "./TreeView/TreeView.test.svelte";
  import TreeViewHierarchy from "./TreeView/TreeView.hierarchy.test.svelte";
  import RecursiveList from "./RecursiveList/RecursiveList.test.svelte";
  import RecursiveListHierarchy from "./RecursiveList/RecursiveList.hierarchy.test.svelte";
  import Tag from "./Tag/Tag.test.svelte";
  import { onMount } from "svelte";

  const routes = [
    {
      path: "/aspect-ratio",
      name: "AspectRatio",
      component: AspectRatio,
    },
    {
      path: "/accordion",
      name: "Accordion",
      component: Accordion,
    },
    {
      path: "/accordion-programmatic",
      name: "AccordionProgrammatic",
      component: AccordionProgrammatic,
    },
    {
      path: "/accordion-disabled",
      name: "AccordionDisabled",
      component: AccordionDisabled,
    },
    {
      path: "/data-table",
      name: "DataTable",
      component: DuplicateDataTables,
    },
    {
      path: "/recursive-list",
      name: "RecursiveList",
      component: RecursiveList,
    },
    {
      path: "/recursive-list-hierarchy",
      name: "RecursiveListHierarchy",
      component: RecursiveListHierarchy,
    },
    {
      path: "/treeview",
      name: "TreeView",
      component: TreeView,
    },
    {
      path: "/treeview-hierarchy",
      name: "TreeViewHierarchy",
      component: TreeViewHierarchy,
    },
    {
      path: "/tag",
      name: "Tag",
      component: Tag,
    },
  ] as const;

  let currentPath = window.location.pathname;

  function navigate(path: string) {
    history.pushState({}, "", path);
    currentPath = path;
  }

  onMount(() => {
    const handlePopState = () => {
      currentPath = window.location.pathname;
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  });
</script>

<div style:display="flex">
  <div>
    <TreeViewNav
      labelText="Routes"
      nodes={routes.map((route) => ({
        id: route.path,
        text: route.name,
      }))}
      on:select={(e) => {
        navigate(e.detail.id.toString());
      }}
    />
  </div>
  <div style:flex="1">
    {#each routes as route (route.path)}
      {#if currentPath === route.path}
        <svelte:component this={route.component} />
      {/if}
    {/each}
  </div>
</div>
