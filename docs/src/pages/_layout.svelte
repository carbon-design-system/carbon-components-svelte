<script>
  import { isActive, url, layout, beforeUrlChange } from "@sveltech/routify";
  import {
    Header,
    HeaderUtilities,
    HeaderAction,
    HeaderActionLink,
    HeaderPanelLinks,
    HeaderPanelLink,
    HeaderPanelDivider,
    SkipToContent,
    SideNav,
    SideNavItems,
    SideNavMenuItem,
    Theme,
    Tag,
  } from "carbon-components-svelte";
  import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
  import { theme } from "../store";

  const deprecated = [];
  const new_components = [];

  let isOpen = false;
  let isSideNavOpen = true;
  let innerWidth = 2048;

  $: isMobile = innerWidth < 1056;
  $: components = $layout.children.filter(
    (child) => child.title === "components"
  )[0];

  $beforeUrlChange(() => {
    if (isMobile) isSideNavOpen = false;
    return true;
  });
</script>

<!-- routify:options bundle=true -->
<svelte:window bind:innerWidth />

<Theme persist bind:theme="{$theme}">
  <Header
    aria-label="Navigation"
    href="{$url('/')}"
    expandedByDefault="{true}"
    bind:isSideNavOpen
  >
    <svelte:fragment slot="skip-to-content">
      <SkipToContent />
    </svelte:fragment>

    <span slot="platform" class="platform-name">
      Carbon Components Svelte &nbsp;<code class="code-01"
        >v{process.env.VERSION || ""}</code
      >
    </span>

    <HeaderUtilities>
      <HeaderActionLink
        icon="{LogoGithub}"
        href="https://github.com/carbon-design-system/carbon-components-svelte"
        target="_blank"
      />
      <HeaderAction transition="{false}" bind:isOpen>
        <HeaderPanelLinks>
          <HeaderPanelDivider>Carbon Svelte portfolio</HeaderPanelDivider>
          <HeaderPanelLink
            href="https://github.com/carbon-design-system/carbon-icons-svelte"
          >
            Carbon Icons Svelte
          </HeaderPanelLink>
          <HeaderPanelLink
            href="https://github.com/carbon-design-system/carbon-pictograms-svelte"
          >
            Carbon Pictograms Svelte
          </HeaderPanelLink>
          <HeaderPanelLink
            href="https://github.com/carbon-design-system/carbon-charts/tree/master/packages/svelte"
          >
            Carbon Charts Svelte
          </HeaderPanelLink>
          <HeaderPanelLink
            href="https://github.com/carbon-design-system/carbon-preprocess-svelte"
          >
            Carbon Preprocess Svelte
          </HeaderPanelLink>
          <HeaderPanelDivider>Resources</HeaderPanelDivider>
          <HeaderPanelLink href="https://www.carbondesignsystem.com/">
            Carbon Design System
          </HeaderPanelLink>
          <HeaderPanelLink href="https://www.ibm.com/design/language/">
            IBM Design Language
          </HeaderPanelLink>
        </HeaderPanelLinks>
      </HeaderAction>
    </HeaderUtilities>
  </Header>

  <SideNav bind:isOpen="{isSideNavOpen}">
    <SideNavItems>
      {#each components.children.filter((child) => !deprecated.includes(child.title)) as child (child.path)}
        <SideNavMenuItem
          text="{child.title}"
          href="{$url(child.path)}"
          isSelected="{$isActive($url(child.path))}"
        >
          {child.title}
          {#if deprecated.includes(child.title)}
            <Tag
              size="sm"
              type="red"
              style="margin-top: 0; margin-bottom: 0; cursor: inherit"
            >
              Deprecated
            </Tag>
          {/if}
          {#if new_components.includes(child.title)}
            <Tag
              size="sm"
              type="green"
              style="margin-top: 0; margin-bottom: 0; cursor: inherit"
            >
              New
            </Tag>
          {/if}
        </SideNavMenuItem>
      {/each}
    </SideNavItems>
  </SideNav>
  <slot />
</Theme>

<style>
  .platform-name {
    display: flex;
    align-items: baseline;
  }

  @media (max-width: 580px) {
    .platform-name code {
      display: none;
    }
  }
</style>
