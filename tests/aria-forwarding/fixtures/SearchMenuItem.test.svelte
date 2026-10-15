<script lang="ts">
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";
  import { onMount } from "svelte";

  let ref: HTMLInputElement | null = null;

  // The menu opens on focus, so focus the input to render the item.
  onMount(() => ref?.focus());
</script>

<SearchMenu labelText="Search" bind:ref>
  <SearchMenuItem text="One" {...$$restProps} />
</SearchMenu>
