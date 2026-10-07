<script lang="ts">
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import ClickableTile from "carbon-components-svelte/Tile/ClickableTile.svelte";
  import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import Tile from "carbon-components-svelte/Tile/Tile.svelte";

  export let selected = false;
</script>

<div data-testid="checkbox">
  <Checkbox labelText="Enable failover"><AILabel slot="decorator" /></Checkbox>
</div>
<div data-testid="checkbox-inline">
  <Checkbox labelText="Inline">
    <AILabel slot="decorator" kind="inline" />
  </Checkbox>
</div>
<div data-testid="checkbox-group">
  <CheckboxGroup legendText="Channels">
    <AILabel slot="decorator" kind="inline" />
    <Checkbox labelText="Email" />
  </CheckboxGroup>
</div>
<div data-testid="radio">
  <RadioButton labelText="Weekly"><AILabel slot="decorator" /></RadioButton>
</div>
<div data-testid="radio-group">
  <RadioButtonGroup legendText="Plan">
    <AILabel slot="decorator" />
    <RadioButton labelText="Team" value="team" />
  </RadioButtonGroup>
</div>
<div data-testid="tag">
  <Tag>Forecast<AILabel slot="decorator" /></Tag>
</div>
<div data-testid="tile">
  <Tile>Forecast<AILabel slot="decorator" size="xl" /></Tile>
</div>
<div data-testid="clickable-tile">
  <ClickableTile href="#">Open<AILabel slot="decorator" /></ClickableTile>
</div>
<div data-testid="selectable-tile">
  <SelectableTile bind:selected
    >Plan<AILabel slot="decorator" /></SelectableTile
  >
</div>
<div data-testid="radio-tile">
  <RadioTile value="a">Plan<AILabel slot="decorator" /></RadioTile>
</div>
<div data-testid="expandable-tile">
  <ExpandableTile>
    <div slot="above">Details</div>
    <div slot="below">More</div>
    <AILabel slot="decorator" />
  </ExpandableTile>
</div>
<div data-testid="plain-tile"><SelectableTile>Plain</SelectableTile></div>
<span data-testid="selected">{selected}</span>
