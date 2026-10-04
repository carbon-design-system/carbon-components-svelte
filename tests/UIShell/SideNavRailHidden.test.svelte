<script lang="ts">
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";

  export let rail = true;
</script>

<SideNav {rail} isOpen={false} ariaLabel="Main">
  <SideNavItems>
    <SideNavLink href="/" text="Dashboard" />
  </SideNavItems>
</SideNav>
