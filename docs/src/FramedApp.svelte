<script lang="ts">
  import type { Component } from "svelte";
  import FramedLayout from "./pages/framed/_module.svelte";

  /** The framed example to show. */
  export let page: Component;
</script>

<FramedLayout><svelte:component this={page} /></FramedLayout>
