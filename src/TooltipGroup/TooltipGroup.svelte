<script>
  /**
   * Groups tooltip triggers so moving between them is instant: once one
   * tooltip in the group is open, hovering or focusing another opens it
   * without the enter delay or fade-in. Renders no element of its own.
   *
   * Nested groups join the enclosing group. `ContentSwitcher`, `Tabs`,
   * `ToggleButtonGroup`, and `UserAvatarGroup` are tooltip groups too.
   */

  /**
   * Specify the delay in milliseconds before the first tooltip in the group opens.
   * Defaults to the enclosing group's delay, or `100`.
   * @type {number | undefined}
   */
  export let enterDelayMs = undefined;

  /**
   * Specify the delay in milliseconds before an open tooltip closes.
   * Defaults to the enclosing group's delay. Without one, icon tooltips
   * close at once and `Tooltip` and `TooltipDefinition` wait `300`, so
   * the pointer can move onto them.
   * @type {number | undefined}
   */
  export let leaveDelayMs = undefined;

  /**
   * Specify how long in milliseconds after a tooltip in the group closes
   * that the next one still opens instantly.
   * Defaults to the enclosing group's window, or `300`.
   * @type {number | undefined}
   */
  export let skipDelayMs = undefined;

  import { provideTooltipGroup } from "../utils/tooltip-group.js";

  provideTooltipGroup({
    enterDelayMs: () => enterDelayMs,
    leaveDelayMs: () => leaveDelayMs,
    skipDelayMs: () => skipDelayMs,
  });
</script>

<slot />
