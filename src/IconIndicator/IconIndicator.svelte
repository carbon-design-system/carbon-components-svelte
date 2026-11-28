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

  /**
   * Set to `true` to show only the icon, keeping the label for screen
   * readers, such as when nearby text already says the status.
   */
  export let hideLabel = false;

  import BuiltinCheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import BuiltinCheckmarkOutline from "../icons/CheckmarkOutline.svelte";
  import BuiltinCircleDash from "../icons/CircleDash.svelte";
  import BuiltinErrorFilled from "../icons/ErrorFilled.svelte";
  import BuiltinInProgress from "../icons/InProgress.svelte";
  import BuiltinIncomplete from "../icons/Incomplete.svelte";
  import BuiltinPendingFilled from "../icons/PendingFilled.svelte";
  import BuiltinUndefinedFilled from "../icons/UndefinedFilled.svelte";
  import BuiltinUnknownFilled from "../icons/UnknownFilled.svelte";
  import BuiltinWarningAltFilled from "../icons/WarningAltFilled.svelte";
  import BuiltinWarningAltInvertedFilled from "../icons/WarningAltInvertedFilled.svelte";
  import BuiltinWarningSquareFilled from "../icons/WarningSquareFilled.svelte";
  import { getIconContext } from "../utils/icon-context.js";

  const {
    CheckmarkFilled = BuiltinCheckmarkFilled,
    CheckmarkOutline = BuiltinCheckmarkOutline,
    CircleDash = BuiltinCircleDash,
    ErrorFilled = BuiltinErrorFilled,
    InProgress = BuiltinInProgress,
    Incomplete = BuiltinIncomplete,
    PendingFilled = BuiltinPendingFilled,
    UndefinedFilled = BuiltinUndefinedFilled,
    UnknownFilled = BuiltinUnknownFilled,
    WarningAltFilled = BuiltinWarningAltFilled,
    WarningAltInvertedFilled = BuiltinWarningAltInvertedFilled,
    WarningSquareFilled = BuiltinWarningSquareFilled,
  } = getIconContext();

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
  class:bx--icon-indicator--hide-label={hideLabel}
  {...$$restProps}
>
  <svelte:component
    this={icons[kind]}
    {size}
    class="bx--icon-indicator--{kind}"
  />
  <span class:bx--visually-hidden={hideLabel}>
    <slot name="labelChildren">{label}</slot>
  </span>
</div>
