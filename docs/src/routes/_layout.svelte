<script>
  export let segment = undefined;

  import {
    Grid,
    Row,
    Column,
    Breadcrumb,
    BreadcrumbItem,
    Content,
    SideNav,
    SideNavItems,
    SideNavMenu,
    SideNavMenuItem,
    SideNavLink,
  } from "carbon-components-svelte";
  import GlobalHeader from "../components/GlobalHeader.svelte";
  import Theme from "../components/Theme.svelte";
  import { afterUpdate, setContext } from "svelte";
  import { writable } from "svelte/store";

  const tail = writable(undefined);

  let prevSegment = undefined;

  const urlIds = {
    about: "About",
    components: "Components",
    "getting-started": "Getting Started",
  };

  setContext("navigation", {
    tail,
    setTail: (value) => {
      tail.set(value);
    },
  });

  afterUpdate(() => {
    if (prevSegment !== segment) {
      if (prevSegment !== undefined) {
        tail.set(undefined);
      }

      prevSegment = segment;
    }
  });
</script>

<style>
  :global(.bx--row h1) {
    margin-bottom: 2.5rem;
  }

  :global(.bx--row p) {
    margin-bottom: 1.5rem;
  }
</style>

{#if segment !== 'examples'}
  <GlobalHeader {segment} />
  <SideNav isOpen={true}>
    <SideNavItems>
      <SideNavLink
        text="Getting Started"
        href="getting-started"
        isSelected={segment === 'getting-started'} />
      <SideNavMenu
        text="Components"
        expanded={segment === 'components'}
        isSelected={segment === 'components' && !$tail}>
        <SideNavMenuItem
          text="Index"
          href="components"
          isSelected={segment === 'components' && $tail && $tail.slug === 'index'} />
        <SideNavMenuItem
          text="Button"
          href="components/button"
          isSelected={segment === 'components' && $tail && $tail.slug === 'button'} />
      </SideNavMenu>
    </SideNavItems>
  </SideNav>
  <Content>
    <Grid>
      <Row>
        <Column
          style="display: flex; align-items: center; justify-content:
          space-between;">
          <Breadcrumb>
            <BreadcrumbItem href="." isCurrentPage={!$tail && !segment}>
              Home
            </BreadcrumbItem>
            {#if segment && $tail}
              <BreadcrumbItem href={segment} isCurrentPage={!$tail}>
                {urlIds[segment]}
              </BreadcrumbItem>
            {/if}
          </Breadcrumb>
          <div>
            <Theme />
          </div>
        </Column>
      </Row>
      <slot />
    </Grid>
  </Content>
{:else}
  <slot />
{/if}
