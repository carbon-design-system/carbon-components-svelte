<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
  import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";

  const items = [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
  ];
  let slider = 50;
  let lower = 20;
  let upper = 80;
  let count = 5;
  let team = "a";
  let owner: string | undefined;
</script>

<button type="button" data-testid="before">Before</button>
<fieldset disabled>
  <legend>Disabled group</legend>
  <Slider labelText="Volume" bind:value={slider} />
  <RangeSlider labelText="Range" bind:value={lower} bind:valueUpper={upper} />
  <NumberInput labelText="Count" scrubbable bind:value={count} />
  <Dropdown labelText="Team" {items} bind:selectedId={team} />
  <ComboBox labelText="Owner" {items} bind:selectedId={owner} />
</fieldset>
<p data-testid="state">
  {JSON.stringify({ slider, lower, upper, count, team, owner }).replaceAll(
    ",",
    ", ",
  )}
</p>
