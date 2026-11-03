<script>
  /**
   * Motion sets the default `transition` for the components inside it.
   * Renders no element of its own. A component's own `transition` prop wins
   * over it.
   *
   * Each prop takes `true` for the components' presets, `false` for none, or
   * shared params such as `{ duration: "fast01" }`. A role prop wins over
   * `transition`. A prop left `undefined` falls back to the enclosing
   * `Motion`. Under `prefers-reduced-motion: reduce`, motion still ends at
   * once unless a setting asks for `reducedMotion: "ignore"`.
   *
   * @example
   * ```svelte
   * <Motion transition tooltip={false}>
   *   <App />
   * </Motion>
   * ```
   */

  /**
   * Set the default for every role.
   * @type {import("./context.js").MotionValue}
   */
  export let transition = undefined;

  /**
   * Set the default for InlineNotification, ToastNotification, and
   * NotificationQueue.
   * @type {import("./context.js").MotionValue}
   */
  export let notification = undefined;

  /**
   * Set the default for the menus of Dropdown, ComboBox, MultiSelect, Menu,
   * MenuButton, OverflowMenu, and HeaderSearch.
   * @type {import("./context.js").MotionValue}
   */
  export let menu = undefined;

  /**
   * Set the default for Tooltip, Toggletip, and Popover.
   * @type {import("./context.js").MotionValue}
   */
  export let tooltip = undefined;

  /**
   * Set the default for Loading, InlineLoading, and ImageLoader.
   * @type {import("./context.js").MotionValue}
   */
  export let loading = undefined;

  /**
   * Set the default for the panels of HeaderAction, HeaderSwitcher, and
   * ProfileMenu.
   * @type {import("./context.js").MotionValue}
   */
  export let panel = undefined;

  /**
   * Set the default for SideNavMenu.
   * @type {import("./context.js").MotionValue}
   */
  export let collapse = undefined;

  import { provideMotion } from "./context.js";

  const settings = provideMotion({
    transition,
    notification,
    menu,
    tooltip,
    loading,
    panel,
    collapse,
  });

  $: settings.set({
    transition,
    notification,
    menu,
    tooltip,
    loading,
    panel,
    collapse,
  });
</script>

<slot />
