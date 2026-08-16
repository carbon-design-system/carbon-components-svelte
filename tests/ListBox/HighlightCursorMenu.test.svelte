<script lang="ts">
  import ListBoxMenu from "carbon-components-svelte/ListBox/ListBoxMenu.svelte";
  import ListBoxMenuItem from "carbon-components-svelte/ListBox/ListBoxMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let highlightedId: ComponentProps<ListBoxMenu>["highlightedId"] =
    undefined;
  export let highlightScroll: ComponentProps<ListBoxMenu>["highlightScroll"] = false;
</script>

<ListBoxMenu id="hl" {highlightedId} {highlightScroll}>
  <ListBoxMenuItem id="hl-a">Alpha</ListBoxMenuItem>
  <ListBoxMenuItem id="hl-b">Beta</ListBoxMenuItem>
  <ListBoxMenuItem id="hl-c" active>Gamma</ListBoxMenuItem>
</ListBoxMenu>
