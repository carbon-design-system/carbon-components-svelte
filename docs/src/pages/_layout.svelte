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
    SideNavMenu,
    SideNavMenuItem,
    Tag,
  } from "carbon-components-svelte";
  import LogoGithub20 from "carbon-icons-svelte/lib/LogoGithub20";
  import Theme from "../components/Theme.svelte";
  import Footer from "../components/Footer.svelte";

  const deprecated = ["ToggleSmall", "Icon"];
  const new_components = ["Theme"];

  let isOpen = false;
  let isSideNavOpen = true;
  let innerWidth = 2048;

  $: isMobile = innerWidth < 1056;
  $: components = $layout.children.filter(
    (child) => child.title === "components"
  )[0];
  $: recipes = $layout.children.filter((child) => child.title === "recipes")[0];

  $beforeUrlChange(() => {
    if (isMobile) isSideNavOpen = false;
    return true;
  });
</script>

<!-- routify:options bundle=true -->
<svelte:window bind:innerWidth />

<Theme persist>
  <Header
    aria-label="Navigation"
    href="{$url('/')}"
    expandedByDefault="{true}"
    bind:isSideNavOpen
  >
    <div slot="skip-to-content">
      <SkipToContent />
    </div>

    <span slot="platform" class="platform-name">
      Carbon Components Svelte
      <code>v{process.env.VERSION || ""}</code>
    </span>

    <HeaderUtilities>
      <HeaderActionLink
        icon="{LogoGithub20}"
        href="https://github.com/IBM/carbon-components-svelte"
        target="_blank"
      />
      <HeaderAction transition="{false}" bind:isOpen>
        <HeaderPanelLinks>
          <HeaderPanelDivider>Carbon Svelte portfolio</HeaderPanelDivider>
          <HeaderPanelLink href="https://github.com/IBM/carbon-icons-svelte">
            Carbon Icons Svelte
          </HeaderPanelLink>
          <HeaderPanelLink
            href="https://github.com/IBM/carbon-pictograms-svelte"
          >
            Carbon Pictograms Svelte
          </HeaderPanelLink>
          <HeaderPanelLink
            href="https://github.com/carbon-design-system/carbon-charts/tree/master/packages/svelte"
          >
            Carbon Charts Svelte
          </HeaderPanelLink>
          <HeaderPanelLink
            href="https://github.com/IBM/carbon-preprocess-svelte"
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
      <SideNavMenu
        expanded="{$isActive($url('')) || $isActive($url('/components'))}"
        text="Components"
      >
        {#each components.children as child, i (child.path)}
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
      </SideNavMenu>
      <SideNavMenu expanded="{$isActive($url('/recipes'))}" text="Recipes">
        {#each recipes.children as child, i (child.path)}
          <SideNavMenuItem
            href="{$url(child.path)}"
            isSelected="{$isActive($url(child.path))}"
          >
            {child.title}
          </SideNavMenuItem>
        {/each}
      </SideNavMenu>
    </SideNavItems>
  </SideNav>
  <slot />
  <Footer />
</Theme>

<style global>
  .body-short-01 {
    font-size: var(--cds-body-short-01-font-size);
    font-weight: var(--cds-body-short-01-font-weight);
    letter-spacing: var(--cds-body-short-01-letter-spacing);
    line-height: var(--cds-body-short-01-line-height);
  }

  .bx--col > h1 {
    font-size: var(--cds-display-01-font-size);
    font-weight: var(--cds-display-01-font-weight);
    letter-spacing: var(--cds-display-01-letter-spacing);
    line-height: var(--cds-display-01-line-height);
    margin-bottom: var(--cds-layout-01);
  }

  .big-paragraph {
    font-size: var(--cds-expressive-heading-03-font-size);
    font-weight: var(--cds-expressive-heading-03-font-weight);
    letter-spacing: var(--cds-expressive-heading-03-letter-spacing);
    line-height: var(--cds-expressive-heading-03-line-height);
    margin-top: var(--cds-layout-03);
    margin-bottom: var(--cds-layout-06);
  }

  .big-link,
  .bx--col > .big-paragraph > code {
    font-size: var(--cds-expressive-heading-03-font-size);
    font-weight: var(--cds-expressive-heading-03-font-weight);
    letter-spacing: var(--cds-expressive-heading-03-letter-spacing);
    line-height: var(--cds-expressive-heading-03-line-height);
  }

  .bx--col > p {
    max-width: 44rem;
  }

  .bx--col > p > code {
    font-size: var(--cds-code-02-font-size);
    font-weight: var(--cds-code-02-font-weight);
    line-height: var(--cds-code-02-line-height);
    letter-spacing: var(--cds-code-02-letter-spacing);
    background-color: var(--cds-ui-03);
    border-radius: 0.25rem;
    padding: 0 var(--cds-spacing-02);
  }

  .bx--col > h2 {
    font-size: var(--cds-expressive-heading-05-font-size);
    font-weight: var(--cds-expressive-heading-05-font-weight);
    letter-spacing: var(--cds-expressive-heading-05-letter-spacing);
    line-height: var(--cds-expressive-heading-05-line-height);
    padding-top: var(--cds-layout-04);
    margin-bottom: var(--cds-layout-01);
  }

  .bx--col > h3 {
    font-size: var(--cds-expressive-heading-04-font-size);
    font-weight: var(--cds-expressive-heading-04-font-weight);
    letter-spacing: var(--cds-expressive-heading-04-letter-spacing);
    line-height: var(--cds-expressive-heading-04-line-height);
    padding-top: var(--cds-layout-04);
    margin-bottom: var(--cds-layout-01);
  }

  .bx--col > h4 {
    font-size: var(--cds-expressive-heading-02-font-size);
    font-weight: var(--cds-expressive-heading-02-font-weight);
    letter-spacing: var(--cds-expressive-heading-02-letter-spacing);
    line-height: var(--cds-expressive-heading-02-line-height);
    padding-top: var(--cds-layout-04);
    margin-bottom: var(--cds-layout-01);
  }

  .bx--col > p {
    margin-bottom: var(--cds-layout-02);
  }

  main.bx--content {
    background: none;
    min-height: calc(100vh - 3rem - 3rem);
  }

  @media (max-width: 1056px) {
    .bx--side-nav ~ .bx--content {
      margin-left: 0;
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .bx--side-nav--expanded ~ .bx--content {
      white-space: nowrap;
      min-width: 28rem;
    }
  }

  .platform-name {
    display: flex;
    align-items: baseline;
  }

  .platform-name code {
    margin-left: var(--cds-spacing-02);
    font-size: var(--cds-code-01-font-size);
    font-weight: var(--cds-code-01-font-weight);
    letter-spacing: var(--cds-code-01-letter-spacing);
    line-height: var(--cds-code-01-line-height);
    color: #c6c6c6;
  }

  @media (max-width: 580px) {
    .platform-name code {
      display: none;
    }
  }

  @media (min-width: 1057px) {
    .bx--side-nav__navigation {
      z-index: 1;
    }
  }

  .bx--side-nav__submenu[aria-expanded="true"] + .bx--side-nav__menu {
    max-height: 144rem;
  }
</style>
