<script>
  /** @restProps {div} */

  /**
   * Specify the kind of the icon indicator.
   * @type {"failed" | "caution-major" | "caution-minor" | "undefined" | "succeeded" | "normal" | "in-progress" | "incomplete" | "not-started" | "pending" | "unknown" | "informative"}
   */
  export let kind;

  /**
   * Specify the label displayed next to the icon.
   * @type {string}
   */
  export let label;

  /**
   * Specify the size of the icon indicator.
   * @type {16 | 20}
   */
  export let size = 16;

  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import CheckmarkOutline from "../icons/CheckmarkOutline.svelte";
  import CircleDash from "../icons/CircleDash.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import Incomplete from "../icons/Incomplete.svelte";
  import InProgress from "../icons/InProgress.svelte";
  import PendingFilled from "../icons/PendingFilled.svelte";
  import UndefinedFilled from "../icons/UndefinedFilled.svelte";
  import UnknownFilled from "../icons/UnknownFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningAltInvertedFilled from "../icons/WarningAltInvertedFilled.svelte";
  import WarningSquareFilled from "../icons/WarningSquareFilled.svelte";

  const icons = {
    failed: ErrorFilled,
    "caution-major": WarningAltInvertedFilled,
    "caution-minor": WarningAltFilled,
    undefined: UndefinedFilled,
    succeeded: CheckmarkFilled,
    normal: CheckmarkOutline,
    "in-progress": InProgress,
    incomplete: Incomplete,
    "not-started": CircleDash,
    pending: PendingFilled,
    unknown: UnknownFilled,
    informative: WarningSquareFilled,
  };
</script>

<div
  class:bx--icon-indicator={true}
  class:bx--icon-indicator--20={size === 20}
  {...$$restProps}
>
  <svelte:component
    this={icons[kind]}
    {size}
    class="bx--icon-indicator--{kind}"
  />
  <slot name="labelChildren">{label}</slot>
</div>
