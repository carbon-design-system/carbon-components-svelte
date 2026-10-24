<script>
  import {
    Button,
    Content,
    Header,
    SidePanel,
    Stack,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListRow,
  } from "carbon-components-svelte";

  const events = [
    { time: "14:05", text: "Deploy started" },
    { time: "14:07", text: "Build succeeded" },
    { time: "14:08", text: "Deploy live" },
  ];

  let open = true;
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Stack gap={5}>
    <p>
      checkout-api serves 1.2k requests per minute across three instances in US
      East. The panel pushes this content aside instead of covering it.
    </p>
    <Button on:click={() => (open = !open)}>
      {open ? "Hide activity" : "Show activity"}
    </Button>
  </Stack>
</Content>

<SidePanel
  bind:open
  slideIn
  selectorPageContent="#main-content"
  size="sm"
  title="Activity"
>
  <StructuredList condensed>
    <StructuredListBody>
      {#each events as event (event.time)}
        <StructuredListRow>
          <StructuredListCell>{event.time}</StructuredListCell>
          <StructuredListCell>{event.text}</StructuredListCell>
        </StructuredListRow>
      {/each}
    </StructuredListBody>
  </StructuredList>
</SidePanel>
