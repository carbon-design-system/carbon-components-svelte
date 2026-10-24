<script>
  import {
    AILabel,
    ClickableTile,
    ExpandableTile,
    RadioTile,
    SelectableTile,
    Tile,
    TileGroup,
  } from "carbon-components-svelte";

  // Short words, so every line runs close to the edge of the content box.
  const text =
    "We pick the best plan for you and the team so you can get on with it";
</script>

<!-- 160px wide: narrow enough that the text meets the corner. -->
{#each ["ltr", "rtl"] as dir}
  <div
    {dir}
    data-testid="tiles-{dir}"
    style="display: flex; flex-wrap: wrap; gap: 1rem"
  >
    <div data-testid="tile" style="width: 160px">
      <Tile>
        {text}
        <AILabel slot="decorator"><p>Explanation</p></AILabel>
      </Tile>
    </div>

    <div data-testid="tile-plain" style="width: 160px">
      <Tile>{text}</Tile>
    </div>

    <div data-testid="clickable-tile" style="width: 160px">
      <ClickableTile href="#top">
        {text}
        <AILabel slot="decorator"><p>Explanation</p></AILabel>
      </ClickableTile>
    </div>

    <div data-testid="selectable-tile" style="width: 160px">
      <SelectableTile>
        {text}
        <AILabel slot="decorator"><p>Explanation</p></AILabel>
      </SelectableTile>
    </div>

    <div data-testid="selectable-tile-selected" style="width: 160px">
      <SelectableTile selected>
        {text}
        <AILabel slot="decorator"><p>Explanation</p></AILabel>
      </SelectableTile>
    </div>

    <div data-testid="selectable-tile-sm" style="width: 160px">
      <SelectableTile size="sm">
        {text}
        <AILabel slot="decorator"><p>Explanation</p></AILabel>
      </SelectableTile>
    </div>

    <!-- The AILabel docs page: 146px wide, one short line. -->
    <div data-testid="selectable-tile-docs" style="width: 146px">
      <SelectableTile>
        Recommended plan: Team
        <AILabel slot="decorator"><p>Explanation</p></AILabel>
      </SelectableTile>
    </div>

    <div data-testid="selectable-tile-plain" style="width: 160px">
      <SelectableTile>{text}</SelectableTile>
    </div>

    <div data-testid="radio-tile" style="width: 160px">
      <TileGroup legendText="Plan" name="plan-{dir}-a">
        <RadioTile value="team">
          {text}
          <AILabel slot="decorator"><p>Explanation</p></AILabel>
        </RadioTile>
      </TileGroup>
    </div>

    <div data-testid="radio-tile-selected" style="width: 160px">
      <TileGroup legendText="Plan" name="plan-{dir}-b" selected="team">
        <RadioTile value="team">
          {text}
          <AILabel slot="decorator"><p>Explanation</p></AILabel>
        </RadioTile>
      </TileGroup>
    </div>

    <div data-testid="expandable-tile" style="width: 160px">
      <ExpandableTile>
        <span slot="above">{text}</span>
        <span slot="below">More about the plan</span>
        <AILabel slot="decorator"><p>Explanation</p></AILabel>
      </ExpandableTile>
    </div>

    <div data-testid="expandable-tile-expanded" style="width: 160px">
      <ExpandableTile expanded>
        <span slot="above">{text}</span>
        <span slot="below">More about the plan</span>
        <AILabel slot="decorator"><p>Explanation</p></AILabel>
      </ExpandableTile>
    </div>
  </div>
{/each}
