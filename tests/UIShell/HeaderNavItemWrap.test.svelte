<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";
</script>

<Header companyName="IBM" platformName="Cloud">
  <HeaderNav>
    <HeaderNavItem href="#catalog" text="Catalog" />
    <HeaderNavMenu text="Products">
      <HeaderNavItem
        href="#storage"
        text="Cloud Object Storage and Data Lake Archival"
      />
    </HeaderNavMenu>
  </HeaderNav>
</Header>
