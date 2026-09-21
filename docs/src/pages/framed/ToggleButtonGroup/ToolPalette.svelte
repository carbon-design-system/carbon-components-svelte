<script>
  import { ToggleButton, ToggleButtonGroup } from "carbon-components-svelte";
  import Crop from "carbon-icons-svelte/lib/Crop.svelte";
  import Eyedropper from "carbon-icons-svelte/lib/Eyedropper.svelte";
  import Move from "carbon-icons-svelte/lib/Move.svelte";
  import PaintBrush from "carbon-icons-svelte/lib/PaintBrush.svelte";
  import Pen from "carbon-icons-svelte/lib/Pen.svelte";
  import SelectWindow from "carbon-icons-svelte/lib/SelectWindow.svelte";
  import Shapes from "carbon-icons-svelte/lib/Shapes.svelte";
  import TextFont from "carbon-icons-svelte/lib/TextFont.svelte";

  let tool = ["move"];
</script>

<ToggleButtonGroup
  orientation="vertical"
  selectionMode="single"
  required
  labelText="Tools"
  bind:selected={tool}
>
  <ToggleButton value="move" icon={Move} iconDescription="Move" />
  <ToggleButton value="select" icon={SelectWindow} iconDescription="Select" />
  <ToggleButton value="crop" icon={Crop} iconDescription="Crop" />
  <ToggleButton value="brush" icon={PaintBrush} iconDescription="Brush" />
  <ToggleButton value="pen" icon={Pen} iconDescription="Pen" />
  <ToggleButton value="shapes" icon={Shapes} iconDescription="Shapes" />
  <ToggleButton value="text" icon={TextFont} iconDescription="Text" />
  <ToggleButton
    value="eyedropper"
    icon={Eyedropper}
    iconDescription="Eyedropper"
  />
</ToggleButtonGroup>
