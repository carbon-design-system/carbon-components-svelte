<script>
  import {
    Link,
    SearchMenu,
    SearchMenuGroup,
    SearchMenuItem,
  } from "carbon-components-svelte";
  import Time from "carbon-icons-svelte/lib/Time.svelte";

  let value = "";
  /** @type {HTMLInputElement | null} */
  let searchRef = null;

  let recent = [
    { id: "recent-vsi", query: "virtual servers" },
    { id: "recent-starter", query: "mobile starter kits" },
    { id: "recent-vpc", query: "vpc" },
    { id: "recent-schematics", query: "schematics workspace" },
  ];
</script>

<SearchMenu
  bind:value
  bind:ref={searchRef}
  labelText="Search"
  placeholder="Search..."
>
  <SearchMenuGroup label="Recent searches" filter={false}>
    <Link
      slot="action"
      href="#"
      on:click={(e) => {
        e.preventDefault();
        recent = [];
        searchRef?.focus();
      }}
    >
      Clear recent searches
    </Link>
    {#each recent as item (item.id)}
      <SearchMenuItem text={item.query} value={item.id} icon={Time} />
    {/each}
  </SearchMenuGroup>
</SearchMenu>
