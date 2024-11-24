<script lang="ts">
  import { TreeView as TreeViewNav } from "carbon-components-svelte";
  import TreeView from "./TreeView/TreeView.test.svelte";
  import { onMount } from "svelte";

  const routes = [
    {
      path: "/treeview",
      name: "TreeView",
      component: TreeView,
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
