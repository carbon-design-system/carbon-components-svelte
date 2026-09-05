<script>
  import {
    Tab,
    TabContent,
    Tabs,
    TabsSkeleton,
    TabsVertical,
    TabsVerticalSkeleton,
  } from "carbon-components-svelte";
  import Calendar from "carbon-icons-svelte/lib/Calendar.svelte";
  import Chat from "carbon-icons-svelte/lib/Chat.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";

  const icons = [Dashboard, Calendar, Chat];
  const labels = ["Dashboard", "Calendar", "Chat", "Disabled"];
</script>

<!--
  Every Tabs variant on one page, for e2e/cascade-snapshot.ts. Capture at
  1280x900 and 320x640 so both sides of the `md` breakpoint are covered.
-->
<section data-testid="line">
  <Tabs>
    {#each labels as label, i}
      <Tab {label} icon={icons[i]} disabled={i === 3} />
    {/each}
    <svelte:fragment slot="content">
      {#each labels as label}
        <TabContent>{label} content</TabContent>
      {/each}
    </svelte:fragment>
  </Tabs>
</section>

<section data-testid="sizes">
  {#each ["sm", "md", "lg", "xl"] as size}
    <Tabs {size}>
      <Tab label="One" /><Tab label="Two" /><Tab label="Off" disabled />
    </Tabs>
    <Tabs type="container" {size}>
      <Tab label="One" /><Tab label="Two" /><Tab label="Off" disabled />
    </Tabs>
  {/each}
</section>

<section data-testid="container">
  <Tabs type="container">
    {#each labels as label, i}
      <Tab
        {label}
        icon={icons[i]}
        secondaryLabel="({i + 1}/4)"
        disabled={i === 3}
      />
    {/each}
    <svelte:fragment slot="content">
      {#each labels as label}
        <TabContent>{label} content</TabContent>
      {/each}
    </svelte:fragment>
  </Tabs>
</section>

<section data-testid="dismissible">
  <Tabs dismissible>
    {#each labels as label, i}
      <Tab {label} icon={icons[i]} disabled={i === 3} />
    {/each}
  </Tabs>
  <Tabs dismissible type="container">
    {#each labels as label, i}
      <Tab {label} icon={icons[i]} disabled={i === 3} />
    {/each}
  </Tabs>
</section>

<section data-testid="icon-only">
  <Tabs iconOnly>
    {#each labels as label, i}
      <Tab {label} icon={icons[i % 3]} disabled={i === 3} />
    {/each}
  </Tabs>
  <Tabs iconOnly iconSize="lg">
    {#each labels as label, i}
      <Tab {label} icon={icons[i % 3]} disabled={i === 3} />
    {/each}
  </Tabs>
  <Tabs iconOnly type="container">
    {#each labels as label, i}
      <Tab {label} icon={icons[i % 3]} disabled={i === 3} />
    {/each}
  </Tabs>
</section>

<section data-testid="widths">
  <Tabs fullWidth>
    <Tab label="One" /><Tab label="Two" />
  </Tabs>
  <Tabs autoWidth>
    <Tab label="One" /><Tab label="Two" />
  </Tabs>
</section>

<section data-testid="overflow" style="inline-size: 320px">
  <Tabs>
    {#each Array.from({ length: 8 }) as _, i}
      <Tab label="Tab label {i + 1}" />
    {/each}
  </Tabs>
  <Tabs type="container">
    {#each Array.from({ length: 8 }) as _, i}
      <Tab label="Tab label {i + 1}" />
    {/each}
  </Tabs>
</section>

<section data-testid="vertical">
  <TabsVertical>
    {#each labels as label, i}
      <Tab {label} icon={icons[i % 3]} disabled={i === 3} />
    {/each}
    <svelte:fragment slot="content">
      {#each labels as label}
        <TabContent>{label} content</TabContent>
      {/each}
    </svelte:fragment>
  </TabsVertical>
  {#each ["sm", "md", "lg"] as size}
    <TabsVertical {size}>
      <Tab label="A long label that wraps onto a second line" />
      <Tab label="Two" />
    </TabsVertical>
  {/each}
</section>

<section data-testid="skeleton">
  <TabsSkeleton count={3} />
  <TabsVerticalSkeleton count={3} />
</section>
