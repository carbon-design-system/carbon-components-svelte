<script lang="ts">
  import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";
</script>

<Toggletip>
  {#snippet labelChildren()}
    <strong data-testid="toggletip-label-children">Density</strong>
  {/snippet}
  Content
</Toggletip>

<HeaderNav>
  <HeaderNavMenu text="Ignored">
    {#snippet textChildren()}
      <span data-testid="header-nav-menu-text-children">Products</span>
    {/snippet}
    <HeaderNavItem href="/a" text="A" />
  </HeaderNavMenu>
</HeaderNav>
