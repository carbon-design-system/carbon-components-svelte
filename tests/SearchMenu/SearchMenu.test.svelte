<script lang="ts">
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "";
  export let open = false;
  export let shouldFilter = true;
  export let disabled = false;
  export let loading = false;
  export let size: ComponentProps<SearchMenu>["size"] = undefined;
  export let menuSize: ComponentProps<SearchMenu>["menuSize"] = undefined;
  export let portal: ComponentProps<SearchMenu>["portal"] = true;
  export let selected: { value: string; submitted: boolean } = {
    value: "",
    submitted: false,
  };
  export let closeTrigger = "";
  export let events: string[] = [];

  const items = [
    "Databases for TestSQL",
    "AT&T IoT Data Plans",
    "Data Store for Memcache",
    "HazardHub Property Risk Data API",
  ];
</script>

<SearchMenu
  bind:value
  bind:open
  {shouldFilter}
  {disabled}
  {loading}
  {size}
  {menuSize}
  {portal}
  placeholder="Search..."
  labelText="Search"
  on:select={(e) => (selected = { value: e.detail.value, submitted: false })}
  on:submit={(e) => (selected = { value: e.detail.value, submitted: true })}
  on:close={(e) => (closeTrigger = e.detail.trigger)}
  on:keyup={() => (events = [...events, "keyup"])}
>
  {#each items as text (text)}
    <SearchMenuItem {text} />
  {/each}
</SearchMenu>

<div data-testid="result">
  {selected.submitted ? "submit:" : ""}{selected.value}
</div>
<div data-testid="close">{closeTrigger}</div>
<div data-testid="events">{events.join(",")}</div>
