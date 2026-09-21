<script lang="ts">
  import ToggleButton from "carbon-components-svelte/ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "carbon-components-svelte/ToggleButtonGroup/ToggleButtonGroup.svelte";
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextItalic from "carbon-icons-svelte/lib/TextItalic.svelte";
  import type { ComponentProps } from "svelte";

  export let orientation: ComponentProps<ToggleButtonGroup>["orientation"] =
    undefined;
  export let tooltipPosition: ComponentProps<ToggleButton>["tooltipPosition"] =
    undefined;
</script>

<ToggleButtonGroup {orientation} aria-label="Text formatting">
  <ToggleButton
    value="bold"
    icon={TextBold}
    iconDescription="Bold"
    {tooltipPosition}
  />
  <ToggleButton value="italic" icon={TextItalic} iconDescription="Italic" />
</ToggleButtonGroup>
