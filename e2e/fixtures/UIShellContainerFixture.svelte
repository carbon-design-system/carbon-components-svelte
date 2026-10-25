<script>
  import {
    Breakpoint,
    Content,
    Header,
    HeaderGlobalAction,
    HeaderUtilities,
    SideNav,
    SideNavItems,
    SideNavLink,
    UIShellContainer,
  } from "carbon-components-svelte";
  import Maximize from "carbon-icons-svelte/lib/Maximize.svelte";

  let expanded = false;
  let wideOpen = false;
  let narrowOpen = false;
  let width = 256;
</script>

<div style="height: 12rem">Page above the shells</div>

<div style="width: 1200px">
  <UIShellContainer
    bind:expanded
    height="24rem"
    data-testid="wide"
    role="region"
    aria-label="Wide app"
  >
    <Header
      companyName="Acme"
      platformName="Wide"
      bind:isSideNavOpen={wideOpen}
    >
      <HeaderUtilities>
        <HeaderGlobalAction
          iconDescription={expanded ? "Return to page" : "Expand"}
          tooltipAlignment="end"
          icon={Maximize}
          on:click={() => (expanded = !expanded)}
        />
      </HeaderUtilities>
    </Header>
    <SideNav resizable bind:width bind:isOpen={wideOpen} ariaLabel="Wide nav">
      <SideNavItems>
        <SideNavLink href="#wide" text="Wide link" />
      </SideNavItems>
    </SideNav>
    <Content>
      <Breakpoint let:size
        ><span data-testid="wide-size">{size}</span></Breakpoint
      >
      <div style="height: 60rem">Wide content</div>
    </Content>
  </UIShellContainer>
</div>

<div style="width: 600px; margin-top: 2rem">
  <UIShellContainer
    theme="g100"
    height="20rem"
    data-testid="narrow"
    role="region"
    aria-label="Narrow app"
  >
    <Header
      companyName="Acme"
      platformName="Narrow"
      bind:isSideNavOpen={narrowOpen}
    />
    <SideNav bind:isOpen={narrowOpen} ariaLabel="Narrow nav">
      <SideNavItems>
        <SideNavLink href="#narrow" text="Narrow link" />
      </SideNavItems>
    </SideNav>
    <Content>
      <Breakpoint let:size
        ><span data-testid="narrow-size">{size}</span></Breakpoint
      >
    </Content>
  </UIShellContainer>
</div>

<div style="height: 150vh">Page below the shells</div>
