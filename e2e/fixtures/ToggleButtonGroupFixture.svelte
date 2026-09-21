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
