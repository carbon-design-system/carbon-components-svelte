<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  export let hashLinked = true;
  export let selected = 0;
  /** `undefined` keeps the index API; set a string to exercise `selectedId`. */
  export let selectedId: string | undefined = undefined;
</script>

<Tabs {hashLinked} bind:selected bind:selectedId>
  <Tab id="overview" label="Overview" />
  <Tab id="activity" label="Activity" />
  <Tab id="settings" label="Settings" />
  <Tab id="billing" label="Billing" disabled />
  <svelte:fragment slot="content">
    <TabContent>Overview content</TabContent>
    <TabContent>Activity content</TabContent>
    <TabContent>Settings content</TabContent>
    <TabContent>Billing content</TabContent>
  </svelte:fragment>
</Tabs>
<div data-testid="selected-index">{selected}</div>
<div data-testid="selected-id">{selectedId ?? ""}</div>
