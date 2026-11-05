<script lang="ts">
  import {
    Tab,
    TabContent,
    Tabs,
    TabsVertical,
  } from "carbon-components-svelte";
</script>

<Tabs>
  <Tab label="One" />
  <Tab label="Two" />
  <svelte:fragment slot="content">
    <TabContent>First list, one</TabContent>
    <TabContent>First list, two</TabContent>
  </svelte:fragment>
</Tabs>

<Tabs>
  <Tab label="Three" />
  <Tab label="Four" />
  <svelte:fragment slot="content">
    <TabContent>Second list, three</TabContent>
    <TabContent>Second list, four</TabContent>
  </svelte:fragment>
</Tabs>

<TabsVertical>
  <Tab label="Five" />
  <Tab label="Six" />
  <svelte:fragment slot="content">
    <TabContent>First vertical list, five</TabContent>
    <TabContent>First vertical list, six</TabContent>
  </svelte:fragment>
</TabsVertical>

<TabsVertical>
  <Tab label="Seven" />
  <Tab label="Eight" />
  <svelte:fragment slot="content">
    <TabContent>Second vertical list, seven</TabContent>
    <TabContent>Second vertical list, eight</TabContent>
  </svelte:fragment>
</TabsVertical>
