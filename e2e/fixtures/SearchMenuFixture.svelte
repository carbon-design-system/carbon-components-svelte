<script>
  import {
    SearchMenu,
    SearchMenuGroup,
    SearchMenuItem,
  } from "carbon-components-svelte";
  import Time from "carbon-icons-svelte/lib/Time.svelte";

  let value = "";
  let lastSelect = "";
  let lastSubmit = "";

  const results = [
    "Databases for TestSQL",
    "AT&T IoT Data Plans",
    "Data Store for Memcache",
    "HazardHub Property Risk Data API",
  ];
</script>

<!-- Sits above the menu so an outside click never lands on a result. -->
<button type="button" data-testid="outside-target">Outside target</button>

<SearchMenu
  bind:value
  data-testid="search-input"
  labelText="Search"
  placeholder="Search..."
  on:select={(e) => (lastSelect = e.detail.value)}
  on:submit={(e) => (lastSubmit = e.detail.value)}
>
  <SearchMenuGroup label="Recent searches" filter={false}>
    <SearchMenuItem text="recent vpc" icon={Time} />
  </SearchMenuGroup>

  <SearchMenuGroup label="Results">
    {#each results as text (text)}
      <SearchMenuItem {text} />
    {/each}
  </SearchMenuGroup>

  <SearchMenuGroup divider>
    <SearchMenuItem persistent text="Carbon docs" href="#carbon-docs" />
  </SearchMenuGroup>
</SearchMenu>

<div data-testid="last-select">{lastSelect}</div>
<div data-testid="last-submit">{lastSubmit}</div>
