<script lang="ts">
  import PageHeader from "carbon-components-svelte/PageHeader/PageHeader.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
</script>

<PageHeader data-testid="container" title="Container tabs">
  <svelte:fragment slot="tabs">
    <Tabs type="container">
      <Tab label="Overview" />
      <Tab label="Backups" />
    </Tabs>
  </svelte:fragment>
</PageHeader>
