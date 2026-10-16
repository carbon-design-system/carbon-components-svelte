<script lang="ts">
  import Breakpoint from "carbon-components-svelte/Breakpoint/Breakpoint.svelte";
  import Content from "carbon-components-svelte/UIShell/Content.svelte";
  import Header from "carbon-components-svelte/UIShell/Header.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
  import SkipToContent from "carbon-components-svelte/UIShell/SkipToContent.svelte";
  import UIShellContainer from "carbon-components-svelte/UIShell/UIShellContainer.svelte";

  /** Container widths the test's ResizeObserver reports, one shell each. */
  export let widths: number[] = [1200];
  export let isOpen: boolean[] = widths.map(() => false);
  export let theme: "white" | "g10" | "g80" | "g90" | "g100" | undefined =
    undefined;
  export let expanded = false;
  export let fixedHeight = true;
  export let height: number | string = "30rem";
</script>

{#each widths as width, i (i)}
  <UIShellContainer
    height={fixedHeight ? height : undefined}
    {theme}
    bind:expanded
    data-width={width}
    data-testid="shell-{i}"
  >
    <Header
      companyName="Acme"
      platformName="Shell {i}"
      bind:isSideNavOpen={isOpen[i]}
    >
      <svelte:fragment slot="skipToContent">
        <SkipToContent />
      </svelte:fragment>
    </Header>
    <SideNav bind:isOpen={isOpen[i]} ariaLabel="Nav {i}">
      <SideNavItems>
        <SideNavLink href="/a" text="Overview" />
      </SideNavItems>
    </SideNav>
    <Content>
      Body {i}
      <Breakpoint let:size>
        <span data-testid="size-{i}">{size}</span>
      </Breakpoint>
    </Content>
  </UIShellContainer>
{/each}
