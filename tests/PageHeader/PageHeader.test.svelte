<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ButtonSet from "carbon-components-svelte/Button/ButtonSet.svelte";
  import PageHeader from "carbon-components-svelte/PageHeader/PageHeader.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";

  let ref: HTMLElement | null = null;
</script>

<PageHeader
  data-testid="basic"
  title="Databases"
  subtitle="Manage your database instances"
/>

<PageHeader data-testid="layer" title="Layer" fill="layer-01" hideDivider />

<PageHeader
  data-testid="sticky-offset"
  title="Sticky offset"
  sticky
  stickyOffset="3rem"
/>

<PageHeader
  data-testid="offset-not-sticky"
  title="Offset without sticky"
  stickyOffset="3rem"
/>

<PageHeader data-testid="small" size="sm" title="Small" />

<PageHeader data-testid="sticky" title="Sticky" sticky bind:ref />

<PageHeader data-testid="with-slots" title="With slots">
  <svelte:fragment slot="breadcrumb">
    <Breadcrumb>
      <BreadcrumbItem href="/">Home</BreadcrumbItem>
    </Breadcrumb>
  </svelte:fragment>
  <svelte:fragment slot="actions">
    <ButtonSet>
      <Button>Create</Button>
    </ButtonSet>
  </svelte:fragment>
</PageHeader>

<PageHeader data-testid="rich" title="Rich">
  <svelte:fragment slot="breadcrumbEnd">
    <button type="button">Share</button>
  </svelte:fragment>
  <svelte:fragment slot="titleStart">
    <span>Icon</span>
  </svelte:fragment>
  <svelte:fragment slot="titleEnd">
    <span>Running</span>
  </svelte:fragment>
  <svelte:fragment slot="description">
    <p>Longer description</p>
  </svelte:fragment>
  <svelte:fragment slot="meta">
    <dl>
      <dt>Region</dt>
      <dd>us-south</dd>
    </dl>
  </svelte:fragment>
</PageHeader>

<PageHeader data-testid="eyebrow" eyebrow="Resources" title="Eyebrow only" />

<PageHeader
  data-testid="eyebrow-icon"
  eyebrow="Resources"
  eyebrowIcon={Folder}
  title="Eyebrow with icon"
/>

<div data-testid="ref-tag">{ref?.tagName}</div>

<PageHeader data-testid="tabs-end-only" title="Tabs end only">
  <svelte:fragment slot="tabsEnd">
    <span>Range</span>
  </svelte:fragment>
</PageHeader>
