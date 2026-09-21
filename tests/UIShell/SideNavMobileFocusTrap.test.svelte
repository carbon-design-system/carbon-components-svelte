<script lang="ts">
  import SideNav from "../../src/UIShell/SideNav.svelte";
  import SideNavItems from "../../src/UIShell/SideNavItems.svelte";
  import SideNavLink from "../../src/UIShell/SideNavLink.svelte";

  export let isOpen = false;
  export let fixed = false;
  export let expansionBreakpoint = 1056;
</script>

<SideNav bind:isOpen {fixed} {expansionBreakpoint}>
  <SideNavItems>
    <SideNavLink text="First" href="/first" />
    <SideNavLink text="Second" href="/second" />
    <SideNavLink text="Third" href="/third" />
  </SideNavItems>
</SideNav>
