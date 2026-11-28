<script lang="ts">
  import {
    Content,
    Header,
    PageHeader,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  const sections = Array.from({ length: 8 }, (_, index) => ({
    id: `region-${index + 1}`,
    title: `Region ${index + 1}`,
  }));
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content style="padding: 0">
  <PageHeader
    sticky
    stickyOffset="stack"
    data-testid="page-header"
    title="Databases"
    subtitle="Manage your database instances"
  />
  <Toolbar sticky stickyOffset="stack" data-testid="toolbar">
    <ToolbarContent>
      <ToolbarSearch labelText="Filter regions" />
    </ToolbarContent>
  </Toolbar>
  <a href="#region-6" data-testid="link">Region 6</a>
  {#each sections as section (section.id)}
    <section id={section.id} style:height="320px">
      <h2>{section.title}</h2>
    </section>
  {/each}
</Content>
