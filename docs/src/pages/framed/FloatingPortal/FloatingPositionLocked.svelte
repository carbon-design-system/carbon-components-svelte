<script>
  import {
    floatingPosition,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
  } from "carbon-components-svelte";

  const viewport = {
    innerWidth: 1024,
    innerHeight: 768,
    scrollX: 0,
    scrollY: 0,
  };
  const anchorRect = {
    top: 700,
    bottom: 740,
    left: 300,
    right: 460,
    width: 160,
    height: 40,
  };
  const floatingRect = {
    top: 0,
    bottom: 120,
    left: 0,
    right: 200,
    width: 200,
    height: 120,
  };

  const results = [
    {
      name: "Preferred direction only",
      ...floatingPosition({
        anchorRect,
        floatingRect,
        viewport,
        direction: "bottom",
      }),
    },
    {
      name: "With lockedDirection",
      ...floatingPosition({
        anchorRect,
        floatingRect,
        viewport,
        direction: "bottom",
        lockedDirection: "bottom",
      }),
    },
  ];
</script>

<StructuredList>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head>Scenario</StructuredListCell>
      <StructuredListCell head>top</StructuredListCell>
      <StructuredListCell head>actualDirection</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    {#each results as result}
      <StructuredListRow>
        <StructuredListCell>{result.name}</StructuredListCell>
        <StructuredListCell>{result.top}</StructuredListCell>
        <StructuredListCell>{result.actualDirection}</StructuredListCell>
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>
