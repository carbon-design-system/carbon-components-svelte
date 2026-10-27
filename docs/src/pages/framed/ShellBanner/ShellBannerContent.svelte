<script>
  import {
    Content,
    Header,
    ShellBanner,
    SideNav,
    SideNavItems,
    SideNavLink,
    SkipToContent,
    Stack,
  } from "carbon-components-svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="Acme" platformName="Status" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
</Header>

<SideNav ariaLabel="Side navigation" rail bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink href="/overview" text="Overview" />
    <SideNavLink href="/incidents" text="Incidents" />
  </SideNavItems>
</SideNav>

<Content>
  <ShellBanner
    sticky
    kind="error"
    label="Incident"
    title="Some API requests are failing."
    subtitle="We are investigating and will post an update within the hour."
  />
  <Stack gap={5}>
    <h1>Overview</h1>
    {#each Array(30) as _, row}
      <p>Row {row + 1}. Scroll to see the banner stick under the header.</p>
    {/each}
  </Stack>
</Content>
