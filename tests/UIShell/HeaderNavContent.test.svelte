<script lang="ts">
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
</script>

<HeaderNav>
  <HeaderNavItem href="/catalog" text="Catalog" />
  <HeaderNavItem
    href="https://example.com/docs"
    target="_blank"
    text="Docs"
    icon={Launch}
  />
  <HeaderNavItem
    href="https://example.com/status"
    target="_blank"
    text="Status"
  >
    <span slot="icon" data-testid="slot-icon" aria-hidden="true">↗</span>
  </HeaderNavItem>
  <HeaderNavMenu text="Plain">
    <HeaderNavItem href="/a" text="A" />
  </HeaderNavMenu>
  <HeaderNavMenu text="With icon" icon={Launch}>
    <HeaderNavItem href="/b" text="B" />
  </HeaderNavMenu>
  <HeaderNavMenu text="Ignored">
    <span slot="text" data-testid="custom-text">Custom label</span>
    <span slot="icon" data-testid="menu-slot-icon" aria-hidden="true">+</span>
    <HeaderNavItem href="/c" text="C" />
  </HeaderNavMenu>
  <HeaderNavMenu text="Products">
    <HeaderNavItem
      href="#storage"
      text="Cloud Object Storage and Data Lake Archival"
    />
  </HeaderNavMenu>
</HeaderNav>
