<script>
  import {
    Content,
    Header,
    SideNav,
    SideNavItems,
    SideNavLink,
  } from "carbon-components-svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen />
<SideNav
  bind:isOpen={isSideNavOpen}
  rail
  enterDelayMs={500}
  leaveDelayMs={500}
  ariaLabel="Side navigation"
>
  <SideNavItems>
    <SideNavLink icon={Dashboard} text="Dashboard" href="#dashboard" />
  </SideNavItems>
</SideNav>
<Content>Content</Content>
