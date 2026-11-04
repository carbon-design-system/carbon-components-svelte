<script>
  import {
    Content,
    Header,
    HeaderAction,
    HeaderNav,
    HeaderNavItem,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderUtilities,
    NotificationActionButton,
    NotificationQueue,
    ShellBanner,
    SideNav,
    SideNavItems,
    SideNavLink,
    SkipToContent,
  } from "carbon-components-svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import UserAvatarFilledAlt from "carbon-icons-svelte/lib/UserAvatarFilledAlt.svelte";
  import { onMount } from "svelte";

  const params = new URLSearchParams(location.search);
  const placement = params.get("placement") ?? "above-header";
  const kind = params.get("kind") ?? "warning-alt";
  const thin = params.has("thin");
  const sticky = params.has("sticky");
  const dismissible = params.has("dismissible");
  const dismissId = params.get("dismissId") ?? undefined;
  const highContrast = params.has("highContrast");
  const wrap = params.has("wrap");
  const longAction = params.has("longAction");
  const announce = params.has("announce");
  const panelOpen = params.has("panel");
  const resizable = params.has("resizable");

  let isSideNavOpen = false;
  let open = true;
  /** @type {NotificationQueue} */
  let queue;

  onMount(() => {
    if (params.has("toast")) {
      queue.add({ kind: "info", title: "Saved", timeout: 0 });
    }
  });
</script>

<Header companyName="E2E" platformName="Shell banner" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderNav aria-label="Top navigation">
    <HeaderNavItem href="#" text="Overview" isSelected />
    <HeaderNavItem href="#" text="Billing" />
  </HeaderNav>
  <HeaderUtilities>
    <HeaderAction
      isOpen={panelOpen}
      icon={UserAvatarFilledAlt}
      iconDescription="Account"
      transition={false}
    >
      <HeaderPanelLinks>
        <HeaderPanelLink href="#">Account</HeaderPanelLink>
        <HeaderPanelLink href="#">Sign out</HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
  </HeaderUtilities>
</Header>

{#if placement === "above-header"}
  <ShellBanner
    placement="above-header"
    {kind}
    {thin}
    {dismissible}
    {dismissId}
    {announce}
    lowContrast={!highContrast}
    label="Impersonation"
    title={thin ? "Staging" : "Viewing as jane@acme.com."}
    subtitle={wrap
      ? "This session is read only. Changes you make here are not saved to the production workspace until you exit impersonation and sign in again with your own account."
      : ""}
    bind:open
  >
    <svelte:fragment slot="actions">
      <NotificationActionButton
        >{longAction
          ? "Exit impersonation and return to your own account"
          : "Exit"}</NotificationActionButton
      >
    </svelte:fragment>
  </ShellBanner>
{/if}

<SideNav
  ariaLabel="Side navigation"
  rail={!resizable}
  {resizable}
  bind:isOpen={isSideNavOpen}
>
  <SideNavItems>
    <SideNavLink icon={Dashboard} text="Dashboard" href="#" isSelected />
    <SideNavLink icon={Dashboard} text="Reports" href="#" />
  </SideNavItems>
</SideNav>

<Content id="main-content" tabindex="-1">
  {#if placement === "content"}
    <ShellBanner
      {kind}
      {thin}
      {sticky}
      {dismissible}
      {dismissId}
      {announce}
      lowContrast={!highContrast}
      label="Incident"
      title="Some API requests are failing."
      subtitle={wrap
        ? "We are investigating elevated error rates on the billing API and will post an update within the hour."
        : ""}
    />
  {/if}
  <h1>Dashboard</h1>
  {#each Array(40) as _, row}
    <p>Row {row + 1}. The content scrolls under the fixed header.</p>
  {/each}
  <button type="button" data-testid="after">After the banner</button>
</Content>

<NotificationQueue bind:this={queue} />
