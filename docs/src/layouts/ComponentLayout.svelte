<script lang="ts">
  import { activeRoute } from "@roxi/routify";
  import {
    Box,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Column,
    Content,
    Dropdown,
    Link,
    OverflowMenu,
    OverflowMenuItem,
    Row,
    Stack,
    Tab,
    TabContent,
    Tabs,
    Text,
  } from "carbon-components-svelte";
  import type { CarbonTheme } from "carbon-components-svelte/src/Theme/Theme.svelte";
  import { themes as themeLabels } from "carbon-components-svelte/src/Theme/Theme.svelte";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import OpenPanelFilledRight from "carbon-icons-svelte/lib/OpenPanelFilledRight.svelte";
  import OpenPanelRight from "carbon-icons-svelte/lib/OpenPanelRight.svelte";
  import OverflowMenuVertical from "carbon-icons-svelte/lib/OverflowMenuVertical.svelte";
  import { onMount, tick } from "svelte";
  import COMPONENT_API from "../COMPONENT_API.json";
  import { CATEGORY_BY_COMPONENT } from "../component-categories";
  import {
    categoryFilterHref,
    sourceRepoUrlForFilePath,
  } from "../component-index";
  import { markdownBytesFor } from "../component-md-sizes";
  import ComponentApi from "../components/ComponentApi.svelte";
  import ComponentDocLayout from "../components/ComponentDocLayout.svelte";
  import ComponentTocLabel from "../components/ComponentTocLabel.svelte";
  import CopyMarkdownButton from "../components/CopyMarkdownButton.svelte";
  import { componentTocOpen, DOC_THEMES, theme } from "../store";
  import { setupTocScrollSpy } from "../toc-scroll-spy";

  type DocComponent = (typeof COMPONENT_API.components)[number];

  const themeItems = DOC_THEMES.map((t) => ({ id: t, text: themeLabels[t] }));

  function isCarbonTheme(value: string | null): value is CarbonTheme {
    return value !== null && DOC_THEMES.includes(value as CarbonTheme);
  }

  export let component = $activeRoute?.leaf?.node?.name ?? "";
  export let components = [component];
  export let description = "";
  export let descriptionHtml = "";

  const componentMap = new Map(
    COMPONENT_API.components.map((c) => [c.moduleName, c]),
  );

  $: api_components = components
    .map((i) => componentMap.get(i))
    .filter((c): c is DocComponent => c != null);
  $: multiple = api_components.length > 1;
  $: category = CATEGORY_BY_COMPONENT[component] ?? "";
  $: categoryHref = category
    ? categoryFilterHref([category])
    : "/component-index";

  let destroyTocSpy: (() => void) | undefined;
  let mounted = false;
  let tocSpyToken = 0;

  onMount(() => {
    mounted = true;
    const searchParams = new URLSearchParams(window.location.search);
    const current_theme = searchParams.get("theme");

    if (isCarbonTheme(current_theme)) {
      theme.set(current_theme);
    }

    return () => {
      mounted = false;
      destroyTocSpy?.();
    };
  });

  $: if (mounted) {
    void initTocSpy(component);
  }

  async function initTocSpy(name: string) {
    destroyTocSpy?.();
    destroyTocSpy = undefined;
    const token = ++tocSpyToken;
    await tick();

    if (token !== tocSpyToken) return;

    const page = document.querySelector(`[data-component="${name}"]`);
    if (page) {
      destroyTocSpy = setupTocScrollSpy(page);
    }
  }

  $: sourceCode = sourceRepoUrlForFilePath(
    api_components[0]?.filePath ?? "",
    multiple,
  );
  $: markdownUrl = `/components/${component}.md`;
  $: markdownBytes = markdownBytesFor(component);

  $: tocToggleIcon = $componentTocOpen ? OpenPanelFilledRight : OpenPanelRight;
  $: tocToggleDescription = $componentTocOpen ? "Hide sidebar" : "Show sidebar";
</script>

<svelte:head>
  <title>{component}</title>
  <link
    rel="canonical"
    href="https://svelte.carbondesignsystem.com/components/{component}"
  >
</svelte:head>

<Content data-component={component}>
  <Box tag="section" class="hero band hero--component">
    <ComponentDocLayout class="hero__layout" aside={false}>
      <Stack gap={3}>
        {#if category}
          <Breadcrumb noTrailingSlash size="sm">
            <BreadcrumbItem href="/component-index">
              Categories
            </BreadcrumbItem>
            <BreadcrumbItem href={categoryHref}>{category}</BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>{component}</BreadcrumbItem>
          </Breadcrumb>
        {/if}
        <Stack gap={7}>
          <Text tag="h1" type="productive-heading-05" color="primary">
            {component}
          </Text>
          {#if descriptionHtml}
            <Text type="body-long-02" color="secondary" maxWidth="60ch">
              {@html descriptionHtml}
            </Text>
          {:else if description}
            <Text type="body-long-02" color="secondary" maxWidth="60ch">
              {description}
            </Text>
          {/if}
        </Stack>
      </Stack>
    </ComponentDocLayout>
  </Box>

  <ComponentDocLayout
    data-components
    data-toc-collapsed={!$componentTocOpen}
    aside={$componentTocOpen}
  >
    <div class="bar bar--component">
      <Dropdown
        class="theme-dropdown"
        type="inline"
        labelText="Theme"
        items={themeItems}
        selectedId={$theme}
        on:select={({ detail }) => {
          theme.set(detail.selectedId);
        }}
      />
      <Stack orientation="horizontal" align="center" gap={2}>
        <CopyMarkdownButton
          name={component}
          href={markdownUrl}
          bytes={markdownBytes}
          size="field"
          tooltipPosition="bottom"
        />
        <OverflowMenu flipped icon={OverflowMenuVertical}>
          <OverflowMenuItem
            icon={Code}
            text="Source code"
            href={sourceCode}
            target="_blank"
          />
          <OverflowMenuItem
            icon={Document}
            text="View Markdown"
            href={markdownUrl}
            target="_blank"
          />
        </OverflowMenu>
        <Button
          class="toc-toggle-btn"
          kind="ghost"
          size="field"
          icon={tocToggleIcon}
          iconDescription={tocToggleDescription}
          tooltipPosition="bottom"
          on:click={() => {
            componentTocOpen.update((open) => !open);
          }}
        />
      </Stack>
    </div>
    <div class="toc mobile">
      <ComponentTocLabel />
      <slot name="aside" />
    </div>
    <slot />
    <Text
      tag="h2"
      id="component-api"
      type="productive-heading-05"
      color="primary"
    >
      Component API
    </Text>
    <Text type="body-long-01" color="secondary">
      API documentation is
      <Link
        inline
        href="https://github.com/carbon-design-system/sveld"
        target="_blank"
      >
        auto-generated by sveld.
      </Link>
    </Text>

    <svelte:fragment slot="rows">
      <Row>
        <Column class="prose" noGutter={multiple}>
          {#if multiple}
            <Tabs class="override-tabs">
              {#each api_components as component (component.moduleName)}
                <Tab label={component.moduleName} />
              {/each}
              <div slot="content" class="tab-content-spacing">
                {#each api_components as component (component.moduleName)}
                  <TabContent><ComponentApi {component} /></TabContent>
                {/each}
              </div>
            </Tabs>
          {:else}
            <ComponentApi component={api_components[0]} />
          {/if}
        </Column>
      </Row>
    </svelte:fragment>

    <svelte:fragment slot="aside">
      <div class="toc">
        <ComponentTocLabel />
        <slot name="aside" />
      </div>
    </svelte:fragment>
  </ComponentDocLayout>
</Content>

<style>
  .tab-content-spacing {
    padding-top: var(--cds-spacing-06);
  }

  .bar {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .bar :global(.theme-dropdown .bx--list-box__menu) {
    min-width: 8rem;
  }

  .bar--component {
    margin-top: calc(-1 * var(--cds-spacing-08) - var(--cds-spacing-08));
    margin-bottom: var(--cds-spacing-07);
    position: relative;
    z-index: 1;
  }

  .toc.mobile {
    display: none;
  }

  @media (max-width: 1056px) {
    .toc.mobile {
      display: block;
      margin-bottom: var(--cds-spacing-09);
    }

    .bar :global(.toc-toggle-btn) {
      display: none;
    }
  }
</style>
