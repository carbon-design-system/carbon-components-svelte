<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   */

  /**
   * @event {MouseEvent} click - Dispatched when the button is pressed or its `shortcut` is. Not dispatched while the button is `disabled`.
   * @restProps {button | a}
   */

  /**
   * Required. Specify the name of the button. It is the tooltip of an
   * icon-only button, the label of a button that shows one, and the text
   * of its item in the "More" menu.
   * @type {string}
   */
  export let labelText;

  /**
   * Specify the icon to render.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Set to `true` to show only the icon, `false` to show the label next to
   * it. Left unset, a button with an icon shows only the icon.
   * @type {boolean | undefined}
   */
  export let iconOnly = undefined;

  /**
   * Set to `true` or `false` to make the button a toggle, announced as
   * pressed or not. It is controlled: change it from `on:click`. Inside an
   * `ActionBarGroup` with `selection="single"`, the group's value decides.
   * @type {boolean | undefined}
   */
  export let pressed = undefined;

  /**
   * Set to `true` to disable the button. A disabled button keeps its place
   * in the tab order and answers to the arrow keys, so focus does not
   * fall out of the bar as buttons turn off, and its tooltip stays
   * reachable. It is `aria-disabled`, not `disabled`.
   */
  export let disabled = false;

  /**
   * Specify a keyboard shortcut, such as `"mod+b"`. The button shows it in
   * its tooltip, or beside the label, sets `aria-keyshortcuts`, and clicks
   * when it is pressed, also while the button is in the "More" menu.
   */
  export let shortcut = "";

  /**
   * Specify how long the button stays as the bar narrows. Buttons with the
   * lowest priority collapse first, and of equal priority the last one.
   */
  export let priority = 0;

  /** Set to `true` so the button never collapses into the "More" menu. */
  export let pinned = false;

  /**
   * Specify the value that selects the button in an `ActionBarGroup` with
   * `selection="single"`.
   * @type {string | number | undefined}
   */
  export let value = undefined;

  /**
   * Specify the kind of button.
   * @type {"primary" | "secondary" | "tertiary" | "ghost" | "danger" | "danger-tertiary" | "danger-ghost"}
   */
  export let kind = "ghost";

  /**
   * Set the position of the tooltip of an icon-only button. It follows the
   * bar's axis: below a horizontal bar, beside a vertical one.
   * @type {"top" | "right" | "bottom" | "left" | undefined}
   */
  export let tooltipPosition = undefined;

  /**
   * Set the alignment of the tooltip of an icon-only button.
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /** Specify the id of the button. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the button element.
   * @bindable readonly
   * @type {null | HTMLAnchorElement | HTMLButtonElement}
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import Button from "../Button/Button.svelte";
  import { onShortcut } from "../utils/keyboard-shortcut.js";
  import { noop } from "../utils/noop.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { BUTTON_SIZE_BY_ACTION_BAR_SIZE } from "./action-bar-sizes.js";

  const bar = getContext("carbon:ActionBar");
  const group = getContext("carbon:ActionBarGroup");

  /** @type {import("svelte/store").Readable<"xs" | "sm" | "md" | "lg">} */
  const barSize = bar?.size ?? readable("md");
  /** @type {import("svelte/store").Readable<"horizontal" | "vertical">} */
  const barOrientation = bar?.orientation ?? readable("horizontal");
  const hidden = bar?.hidden ?? readable(new Set());
  const tabStopId = bar?.tabStopId ?? readable(null);
  const groupSelection = group?.selection ?? readable("none");
  const groupValue = group?.value ?? readable(undefined);
  /** @type {import("svelte/store").Readable<string | undefined>} */
  const groupLabel = group?.labelText ?? readable(undefined);

  /** @type {(() => void) | undefined} */
  let unregister;
  let releaseShortcut = noop;

  $: radio = $groupSelection === "single";
  $: checked = radio ? $groupValue === value : pressed;
  $: hasIcon = icon !== undefined;
  $: showsIconOnly = hasIcon && (iconOnly ?? true);
  $: collapsed = $hidden.has(id);
  $: position =
    tooltipPosition ?? ($barOrientation === "vertical" ? "right" : "bottom");
  $: tabindex = $tabStopId === null ? undefined : $tabStopId === id ? 0 : -1;
  $: danger = kind.startsWith("danger");

  // A collapsed button is not shown, so `Button` would not take its
  // shortcut: the bar takes it for the button.
  $: {
    releaseShortcut();
    releaseShortcut =
      collapsed && shortcut && !disabled
        ? onShortcut(shortcut, () => ref?.click())
        : noop;
  }

  function handleClick() {
    if (!disabled && radio && value !== undefined) group.select(value);
  }

  function activate() {
    ref?.click();
  }

  $: bar?.update(id, {
    label: labelText,
    icon,
    disabled,
    checked: radio || pressed !== undefined ? !!checked : undefined,
    radio,
    groupLabel: $groupLabel ?? "",
    shortcut,
    priority,
    pinned,
    danger,
  });

  onMount(() => {
    if (bar && ref) {
      unregister = bar.register({
        id,
        kind: "item",
        node: ref,
        groupId: group?.id,
        priority,
        pinned,
        focusable: true,
        managed: false,
        label: labelText,
        icon,
        disabled,
        checked: radio || pressed !== undefined ? !!checked : undefined,
        radio,
        groupLabel: $groupLabel ?? "",
        shortcut,
        danger,
        activate,
      });
    }
    return () => {
      unregister?.();
      releaseShortcut();
    };
  });
</script>

<Button
  bind:ref
  {id}
  {kind}
  {icon}
  size={BUTTON_SIZE_BY_ACTION_BAR_SIZE[$barSize]}
  iconOnly={showsIconOnly}
  iconDescription={showsIconOnly ? labelText : undefined}
  shortcut={collapsed ? "" : shortcut}
  tooltipPosition={position}
  {tooltipAlignment}
  {tabindex}
  role={radio ? "radio" : undefined}
  aria-checked={radio ? !!checked : undefined}
  aria-pressed={!radio && pressed !== undefined ? !!pressed : undefined}
  aria-disabled={disabled ? "true" : undefined}
  {...$$restProps}
  class={[
    "bx--action-bar__button",
    collapsed && "bx--action-bar__button--collapsed",
    checked && "bx--action-bar__button--pressed",
    disabled && "bx--btn--disabled",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ")}
  on:click={handleClick}
  on:click
  on:shortcut
  on:focus
  on:blur
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if !showsIconOnly}{labelText}{/if}
</Button>
