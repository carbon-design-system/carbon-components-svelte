<script>
  import {
    Button,
    Content,
    Header,
    HeaderNav,
    HeaderNavItem,
    NotificationActionButton,
    ShellBanner,
    SideNav,
    SideNavItems,
    SideNavLink,
    SkipToContent,
    Stack,
  } from "carbon-components-svelte";

  let isSideNavOpen = false;
  let impersonating = true;
</script>

<Header companyName="Acme" platformName="Admin" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderNav aria-label="Primary">
    <HeaderNavItem href="/customers" text="Customers" />
    <HeaderNavItem href="/billing" text="Billing" />
  </HeaderNav>
</Header>

<ShellBanner
  placement="above-header"
  kind="warning-alt"
  label="Impersonation"
  title="Viewing as jane@acme.com."
  bind:open={impersonating}
>
  <svelte:fragment slot="actions">
    <NotificationActionButton on:click={() => (impersonating = false)}>
      Exit
    </NotificationActionButton>
  </svelte:fragment>
</ShellBanner>

<SideNav ariaLabel="Side navigation" rail bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink href="/customers" text="Customers" />
    <SideNavLink href="/billing" text="Billing" />
  </SideNavItems>
</SideNav>

<Content>
  <Stack gap={5}>
    <h1>Customers</h1>
    <p>
      The header, side navigation and content sit below the banner, and move
      back up when it closes.
    </p>
    <Button kind="tertiary" on:click={() => (impersonating = !impersonating)}>
      {impersonating ? "Hide" : "Show"} banner
    </Button>
  </Stack>
</Content>
