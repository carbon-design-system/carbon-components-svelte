<script>
  import {
    Header,
    HeaderSearch,
    HeaderUtilities,
    SearchMenuItem,
  } from "carbon-components-svelte";

  // Slow enough to inspect mid-exit.
  const menuTransition = { duration: "slow02" };

  const results = [
    { href: "#a", text: "Databases" },
    { href: "#b", text: "Data Store for Memcache" },
  ];
</script>

<Header companyName="E2E" platformName="Header search">
  <HeaderUtilities>
    <HeaderSearch
      {menuTransition}
      id="results"
      labelText="Search results"
      {results}
    />
    <HeaderSearch {menuTransition} id="rich" labelText="Search rich">
      <svelte:fragment slot="menu">
        <SearchMenuItem text="Databases" />
        <SearchMenuItem text="Data Store for Memcache" />
      </svelte:fragment>
    </HeaderSearch>
  </HeaderUtilities>
</Header>
