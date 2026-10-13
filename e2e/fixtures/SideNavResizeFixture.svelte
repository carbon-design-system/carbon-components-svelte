<script>
  import {
    Content,
    Header,
    SideNav,
    SideNavItems,
    SideNavLink,
  } from "carbon-components-svelte";

  let isSideNavOpen = true;
  let width = 256;
  let resizes = 0;
</script>

<Header companyName="IBM" platformName="Cloud" bind:isSideNavOpen />
<SideNav
  bind:isOpen={isSideNavOpen}
  bind:width
  resizable
  ariaLabel="Side navigation"
  on:resize={() => resizes++}
>
  <SideNavItems>
    <SideNavLink text="Dashboard" href="#dashboard" />
  </SideNavItems>
</SideNav>
<Content>
  <p data-testid="width">{width}</p>
  <p data-testid="resize-count">{resizes}</p>
</Content>
