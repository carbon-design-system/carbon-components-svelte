<script>
  import { ToggleButton, ToggleButtonGroup } from "carbon-components-svelte";
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextUnderline from "carbon-icons-svelte/lib/TextUnderline.svelte";

  let selected = ["bold"];
</script>

<ToggleButtonGroup labelText="Text formatting" bind:selected>
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
  <ToggleButton value="underline" disabled>Underline</ToggleButton>
</ToggleButtonGroup>

<div data-testid="grid-wide" style="width: 420px">
  <ToggleButtonGroup labelText="Times" size="sm" selectionMode="single" grid>
    {#each [
      "9:00 AM",
      "9:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "2:00 PM",
    ] as time (time)}
      <ToggleButton value={time}>{time}</ToggleButton>
    {/each}
  </ToggleButtonGroup>
</div>

<div data-testid="grid-narrow" style="width: 300px">
  <ToggleButtonGroup
    labelText="Times narrow"
    size="sm"
    selectionMode="single"
    grid
  >
    {#each [
      "9:00 AM",
      "9:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "2:00 PM",
    ] as time (time)}
      <ToggleButton value={time}>{time}</ToggleButton>
    {/each}
  </ToggleButtonGroup>
</div>

<p data-testid="selected">Selected: {selected.join(", ") || "none"}</p>

<ToggleButtonGroup orientation="vertical" labelText="Vertical icon-only">
  <ToggleButton
    value="bold"
    icon={TextBold}
    iconDescription="Bold"
    tooltipAlignment="start"
  />
  <ToggleButton
    value="underline"
    icon={TextUnderline}
    iconDescription="Underline"
    tooltipAlignment="end"
  />
</ToggleButtonGroup>
