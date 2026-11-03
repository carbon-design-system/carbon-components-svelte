<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import Motion from "carbon-components-svelte/motion/Motion.svelte";
  import type { MotionValue } from "carbon-components-svelte/motion/context.js";
  import type { TransitionProp } from "carbon-components-svelte/motion/resolve-transition.js";
  import type { SlideParams } from "carbon-components-svelte/motion/transitions.js";

  export let kind: "dropdown" | "combo-box" | "multi-select";
  export let transition: TransitionProp<SlideParams> = undefined;
  export let portalMenu = false;
  export let motionMenu: MotionValue = undefined;

  const items = [
    { id: "1", text: "Apple" },
    { id: "2", text: "Banana" },
  ];
</script>

<Motion menu={motionMenu}>
  {#if kind === "dropdown"}
    <Dropdown id="field" labelText="Fruit" {items} {portalMenu} {transition} />
  {:else if kind === "combo-box"}
    <ComboBox id="field" labelText="Fruit" {items} {portalMenu} {transition} />
  {:else}
    <MultiSelect
      id="field"
      labelText="Fruit"
      label="Pick"
      {items}
      {portalMenu}
      {transition}
    />
  {/if}
</Motion>
