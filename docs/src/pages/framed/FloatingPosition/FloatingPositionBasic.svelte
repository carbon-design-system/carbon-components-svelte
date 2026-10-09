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
  const floatingRect = {
    top: 0,
    bottom: 120,
    left: 0,
    right: 200,
    width: 200,
    height: 120,
  };

  const anchors = [
    { name: "Anchor near the top", top: 100 },
    { name: "Anchor near the bottom", top: 700 },
  ].map(({ name, top }) => {
    const anchorRect = {
      top,
      bottom: top + 40,
      left: 300,
      right: 460,
      width: 160,
      height: 40,
    };
    return {
      name,
      ...floatingPosition({
        anchorRect,
        floatingRect,
        viewport,
        direction: "bottom",
      }),
    };
  });
</script>

<StructuredList>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head>Scenario</StructuredListCell>
      <StructuredListCell head>top</StructuredListCell>
      <StructuredListCell head>left</StructuredListCell>
      <StructuredListCell head>actualDirection</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    {#each anchors as anchor}
      <StructuredListRow>
        <StructuredListCell>{anchor.name}</StructuredListCell>
        <StructuredListCell>{anchor.top}</StructuredListCell>
        <StructuredListCell>{anchor.left}</StructuredListCell>
        <StructuredListCell>{anchor.actualDirection}</StructuredListCell>
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>
