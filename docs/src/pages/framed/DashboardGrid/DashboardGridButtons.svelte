<script>
  import {
    Button,
    ButtonSet,
    DashboardGrid,
    DashboardGridItem,
    Layer,
    nudgeLayoutItem,
    Stack,
  } from "carbon-components-svelte";

  let layout = [
    { id: "revenue", x: 0, y: 0, w: 6, h: 2 },
    { id: "orders", x: 6, y: 0, w: 6, h: 2 },
  ];
  let selected = "revenue";

  /**
   * @param {-1 | 0 | 1} dx
   * @param {-1 | 0 | 1} dy
   */
  function nudge(dx, dy) {
    layout = nudgeLayoutItem(layout, selected, dx, dy, { cols: 12 });
  }
</script>

<Stack gap={5}>
  <ButtonSet>
    <Button size="small" kind="tertiary" on:click={() => nudge(-1, 0)}>
      Move left
    </Button>
    <Button size="small" kind="tertiary" on:click={() => nudge(1, 0)}>
      Move right
    </Button>
    <Button size="small" kind="tertiary" on:click={() => nudge(0, 1)}>
      Move down
    </Button>
    <Button size="small" kind="tertiary" on:click={() => nudge(0, -1)}>
      Move up
    </Button>
  </ButtonSet>
  <Layer withBackground>
    <DashboardGrid bind:layout cols={12} rowHeight={72} aria-label="Overview">
      {#each layout as item (item.id)}
        <DashboardGridItem id={item.id} titleText={item.id}>
          <Button
            size="small"
            kind={selected === item.id ? "primary" : "ghost"}
            on:click={() => (selected = item.id)}
          >
            {selected === item.id ? "Selected" : "Select"}
          </Button>
        </DashboardGridItem>
      {/each}
    </DashboardGrid>
  </Layer>
</Stack>
