<script lang="ts">
  import { Tabs, Tab, TabContent, TabsSkeleton } from "../types";
</script>

<Tabs>
  <Tab label="Tab label 1" />
  <Tab label="Tab label 2" />
  <Tab label="Tab label 3" />
  <div slot="content">
    <TabContent>Content 1</TabContent>
    <TabContent>Content 2</TabContent>
    <TabContent>Content 3</TabContent>
  </div>
</Tabs>

<TabContent>Content 1</TabContent>

<TabContent>Content 2</TabContent>

<TabContent>Content 3</TabContent>

<Tabs type="container">
  <Tab label="Tab label 1" />
  <Tab label="Tab label 2" />
  <Tab label="Tab label 3" />
  <div slot="content">
    <TabContent>Content 1</TabContent>
    <TabContent>Content 2</TabContent>
    <TabContent>Content 3</TabContent>
  </div>
</Tabs>

<TabContent>Content 1</TabContent>

<TabContent>Content 2</TabContent>

<TabContent>Content 3</TabContent>

<TabsSkeleton count="{3}" />
