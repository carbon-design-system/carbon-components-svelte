<script>
  /** @restProps {div} */

  /**
   * Specify the kind of the shape indicator.
   * @type {"failed" | "critical" | "high" | "medium" | "low" | "cautious" | "undefined" | "stable" | "informative" | "incomplete" | "draft"}
   */
  export let kind;

  /**
   * Specify the label displayed next to the shape.
   * @type {string}
   */
  export let label;

  /**
   * Specify the text size of the shape indicator.
   * @type {12 | 14}
   */
  export let textSize = 12;

  import BuiltinCaution from "../icons/Caution.svelte";
  import BuiltinCircleFill from "../icons/CircleFill.svelte";
  import BuiltinCircleStroke from "../icons/CircleStroke.svelte";
  import BuiltinCritical from "../icons/Critical.svelte";
  import BuiltinCriticalSeverity from "../icons/CriticalSeverity.svelte";
  import BuiltinDiamondFill from "../icons/DiamondFill.svelte";
  import BuiltinLowSeverity from "../icons/LowSeverity.svelte";
  import { getIconContext } from "../utils/icon-context.js";
  import ShapeIndicatorIncomplete from "./ShapeIndicatorIncomplete.svelte";

  const {
    Caution = BuiltinCaution,
    CircleFill = BuiltinCircleFill,
    CircleStroke = BuiltinCircleStroke,
    Critical = BuiltinCritical,
    CriticalSeverity = BuiltinCriticalSeverity,
    DiamondFill = BuiltinDiamondFill,
    LowSeverity = BuiltinLowSeverity,
  } = getIconContext();

  const shapes = {
    failed: Critical,
    critical: CriticalSeverity,
    high: Caution,
    medium: DiamondFill,
    low: LowSeverity,
    cautious: Caution,
    undefined: DiamondFill,
    stable: CircleFill,
    informative: LowSeverity,
    incomplete: ShapeIndicatorIncomplete,
    draft: CircleStroke,
  };
</script>

<div
  class:bx--shape-indicator={true}
  class:bx--shape-indicator--14={textSize === 14}
  {...$$restProps}
>
  <svelte:component
    this={shapes[kind]}
    size={16}
    class="bx--shape-indicator--{kind}"
  />
  <slot name="labelChildren">{label}</slot>
</div>
