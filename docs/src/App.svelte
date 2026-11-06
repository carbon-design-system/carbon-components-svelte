<script lang="ts">
  import type { Component } from "svelte";
  import { onMount, tick } from "svelte";
  import RootLayout from "./pages/_module.svelte";
  import FramedLayout from "./pages/framed/_module.svelte";
  import {
    eagerContent,
    loadPage,
    location,
    matchRoute,
    restoreScroll,
    type Route,
    route,
    scrollsAwayFromTop,
    startRouter,
  } from "./router";

  let Page: Component | undefined;
  let loading = 0;

  async function show(next: Route | undefined) {
    if (!next) return;
    if (next === $route) {
      // Same page, another heading or query: render all of it first, so
      // the heading stays where the scroll puts it.
      eagerContent.set(true);
      await tick();
      restoreScroll();
      return;
    }
    const token = ++loading;
    const loaded = await loadPage(next);
    if (token !== loading || !loaded) return;
    eagerContent.set(scrollsAwayFromTop());
    Page = loaded.component;
    route.set(loaded.route);
    await tick();
    restoreScroll();
  }

  $: show(matchRoute($location.pathname));

  onMount(startRouter);
</script>

{#if Page}
  {#if $route?.path.startsWith("/framed/")}
    <FramedLayout><svelte:component this={Page} /></FramedLayout>
  {:else}
    <RootLayout><svelte:component this={Page} /></RootLayout>
  {/if}
{/if}
