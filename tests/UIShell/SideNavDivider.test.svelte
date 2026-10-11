<script lang="ts">
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavDivider from "carbon-components-svelte/UIShell/SideNavDivider.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
</script>

<SideNav isOpen>
  <SideNavItems>
    <SideNavLink href="/" text="Link 1" />
    <SideNavDivider data-testid="divider" />
    <SideNavLink href="/" text="Link 2" />
  </SideNavItems>
</SideNav>
