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
    top: 100,
    bottom: 140,
    left: 300,
    right: 460,
    width: 160,
    height: 40,
  };
  const floatingRect = {
    top: 0,
    bottom: 120,
    left: 0,
    right: 240,
    width: 240,
    height: 120,
  };

  const results = [
    {
      name: "Matches anchor width",
      ...floatingPosition({
        anchorRect,
        floatingRect,
        viewport,
        direction: "bottom",
      }),
    },
    {
      name: "intrinsicWidth, aligned to end",
      ...floatingPosition({
        anchorRect,
        floatingRect,
        viewport,
        direction: "bottom",
        intrinsicWidth: true,
        intrinsicAlign: "end",
      }),
    },
  ];
</script>

<StructuredList>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head>Scenario</StructuredListCell>
      <StructuredListCell head>left</StructuredListCell>
      <StructuredListCell head>width</StructuredListCell>
      <StructuredListCell head>caretNudgePx</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    {#each results as result}
      <StructuredListRow>
        <StructuredListCell>{result.name}</StructuredListCell>
        <StructuredListCell>{result.left}</StructuredListCell>
        <StructuredListCell>{result.width ?? "none"}</StructuredListCell>
        <StructuredListCell>{result.caretNudgePx ?? "none"}</StructuredListCell>
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>
