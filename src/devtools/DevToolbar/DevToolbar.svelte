<script>
  /**
   * @typedef {"grid" | "baseline" | "textBaselines" | "inspect" | "spacing" | "contrast" | "targets" | "overflow" | "rtl"} DevToolbarTool
   * @typedef {Record<DevToolbarTool, boolean>} DevToolbarTools
   * @event {DevToolbarTools} change Fires when a tool turns on or off from the toolbar or a shortcut.
   * @restProps {section}
   */

  /**
   * Which tools are on.
   * Bind to read or set them from outside, for example to turn on a preset.
   * Listen to `change` to react only when a person turns a tool on or off.
   * @type {DevToolbarTools}
   * @bindable
   */
  export let tools = {
    grid: false,
    baseline: false,
    textBaselines: false,
    inspect: false,
    spacing: false,
    contrast: false,
    targets: false,
    overflow: false,
    rtl: false,
  };

  /**
   * Set to `false` to collapse the toolbar to a small handle.
   * Tools stay on while it is collapsed.
   * @bindable
   */
  export let expanded = true;

  /** Set to `false` to stop saving `tools` and `expanded` to `localStorage`. */
  export let persist = true;

  /** `localStorage` key used when `persist` is `true`. */
  export let persistKey = "ccs-dev-toolbar";

  /**
   * Set to `false` to turn off the keyboard shortcuts.
   * Each tool toggles with Alt+Shift (Option+Shift on macOS) and a letter; Alt+Shift+D shows or hides the toolbar.
   */
  export let shortcuts = true;

  /**
   * Props passed to the `GridOverlay` the toolbar renders, for example `{ condensed: true, baselineOffset: 48 }`.
   * The toolbar sets `open`, `columns`, `baseline`, and `textBaselines`; set `baseline` here to change the row step from 8.
   * @type {Partial<import("../GridOverlay/GridOverlay.svelte").GridOverlayProps>}
   */
  export let gridProps = {};

  /**
   * Props passed to the `LayoutInspector` the toolbar renders, for example `{ measureKey: "Shift", cardPlacement: "corner" }`.
   * The toolbar sets `open` and the props for each tool.
   * @type {Partial<import("../LayoutInspector/LayoutInspector.svelte").LayoutInspectorProps>}
   */
  export let inspectorProps = {};

  import { createEventDispatcher, onMount } from "svelte";
  import BadgeIndicator from "../../BadgeIndicator/BadgeIndicator.svelte";
  import Button from "../../Button/Button.svelte";
  import ToggleButton from "../../ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "../../ToggleButtonGroup/ToggleButtonGroup.svelte";
  import TooltipGroup from "../../TooltipGroup/TooltipGroup.svelte";
  import Close from "../../icons/Close.svelte";
  import Contrast from "../../icons/Contrast.svelte";
  import FitToWidth from "../../icons/FitToWidth.svelte";
  import GridIcon from "../../icons/GridIcon.svelte";
  import Inspection from "../../icons/Inspection.svelte";
  import Ruler from "../../icons/Ruler.svelte";
  import TextAlignRight from "../../icons/TextAlignRight.svelte";
  import TextLineSpacing from "../../icons/TextLineSpacing.svelte";
  import TextVerticalAlignment from "../../icons/TextVerticalAlignment.svelte";
  import Tools from "../../icons/Tools.svelte";
  import TouchInteraction from "../../icons/TouchInteraction.svelte";
  import GridOverlay from "../GridOverlay/GridOverlay.svelte";
  import LayoutInspector from "../LayoutInspector/LayoutInspector.svelte";

  /** @type {{ id: DevToolbarTool; icon: any; key: string; title: string }[]} */
  const TOOLS = [
    { id: "grid", icon: GridIcon, key: "G", title: "Grid columns" },
    { id: "baseline", icon: TextLineSpacing, key: "B", title: "Baseline rows" },
    {
      id: "textBaselines",
      icon: TextVerticalAlignment,
      key: "A",
      title: "Text baselines",
    },
    {
      id: "inspect",
      icon: Inspection,
      key: "I",
      title: "Inspect on hover",
    },
    { id: "spacing", icon: Ruler, key: "S", title: "Off-scale spacing" },
    {
      id: "contrast",
      icon: Contrast,
      key: "C",
      title: "Low contrast text",
    },
    {
      id: "targets",
      icon: TouchInteraction,
      key: "T",
      title: "Small targets",
    },
    {
      id: "overflow",
      icon: FitToWidth,
      key: "O",
      title: "Overflow",
    },
    { id: "rtl", icon: TextAlignRight, key: "R", title: "Right-to-left" },
  ];

  const GROUPS = [
    { label: "Layout overlays", ids: ["grid", "baseline", "textBaselines"] },
    {
      label: "Checks",
      ids: ["inspect", "spacing", "contrast", "targets", "overflow"],
    },
    { label: "Direction", ids: ["rtl"] },
  ].map((group) => ({
    label: group.label,
    tools: TOOLS.filter((t) => group.ids.includes(t.id)),
  }));

  const dispatch = createEventDispatcher();

  /** @param {{ title: string; key: string }} tool */
  const describe = (tool) =>
    shortcuts ? `${tool.title} (Alt+Shift+${tool.key})` : tool.title;

  /**
   * Selected tool ids for one group, for `ToggleButtonGroup`.
   * @param {DevToolbarTool[]} ids
   */
  const selectedIn = (ids) => ids.filter((id) => tools[id]);

  /**
   * Writes one group's selection back to `tools`.
   * @param {DevToolbarTool[]} ids
   * @param {ReadonlyArray<string | number>} selected
   */
  function setGroup(ids, selected) {
    const next = { ...tools };
    for (const id of ids) next[id] = selected.includes(id);
    tools = next;
    dispatch("change", tools);
  }

  let mounted = false;

  /** @param {DevToolbarTool} id */
  function toggle(id) {
    tools = { ...tools, [id]: !tools[id] };
    dispatch("change", tools);
  }

  onMount(() => {
    if (persist) {
      try {
        const saved = JSON.parse(localStorage.getItem(persistKey) ?? "null");
        if (saved?.tools) {
          // Only known tools, so a key saved by an older version is dropped.
          const next = { ...tools };
          for (const { id } of TOOLS) {
            if (typeof saved.tools[id] === "boolean")
              next[id] = saved.tools[id];
          }
          tools = next;
        }
        if (typeof saved?.expanded === "boolean") expanded = saved.expanded;
      } catch {
        // Ignore unreadable or blocked storage.
      }
    }
    mounted = true;

    const previousDir = document.documentElement.getAttribute("dir");
    return () => {
      // Leave the page as it was found.
      if (!setRtl) return;
      if (previousDir === null) document.documentElement.removeAttribute("dir");
      else document.documentElement.setAttribute("dir", previousDir);
    };
  });

  $: if (mounted && persist) {
    try {
      localStorage.setItem(persistKey, JSON.stringify({ tools, expanded }));
    } catch {
      // Ignore blocked storage.
    }
  }

  // Only undo a `dir` the toolbar set, so an app that is already RTL
  // stays RTL.
  let setRtl = false;
  $: if (mounted && tools.rtl !== setRtl) {
    if (tools.rtl) document.documentElement.setAttribute("dir", "rtl");
    else document.documentElement.removeAttribute("dir");
    setRtl = tools.rtl;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (
      !shortcuts ||
      !event.altKey ||
      !event.shiftKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }
    const target = /** @type {HTMLElement | null} */ (event.target);
    if (
      target?.isContentEditable ||
      target?.closest?.("input, textarea, select")
    ) {
      return;
    }
    // `code`, not `key`: Option+Shift on macOS turns letters into symbols.
    const letter = event.code.startsWith("Key") ? event.code.slice(3) : "";
    if (letter === "D") {
      event.preventDefault();
      expanded = !expanded;
      return;
    }
    const tool = TOOLS.find((t) => t.key === letter);
    if (tool) {
      event.preventDefault();
      toggle(tool.id);
    }
  }

  $: activeCount = TOOLS.filter((t) => tools[t.id]).length;
  $: inspecting = tools.inspect;
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- dir="ltr": the bar keeps its order when the RTL tool flips the page. -->
<section
  aria-label="Developer tools"
  dir="ltr"
  {...$$restProps}
  class:bx--dev-toolbar={true}
  data-ccs-dev-tool
>
  <!-- One tooltip group for the whole bar: once a tooltip shows, moving
       to any other tool, across groups, shows the next one at once. The
       leave delay holds it open across the gap at each divider, so it
       does not flicker. -->
  <TooltipGroup leaveDelayMs={100}>
    {#if expanded}
      {#each GROUPS as group, g (group.label)}
        {#if g > 0}
          <span class="bx--dev-toolbar__divider" aria-hidden="true"></span>
        {/if}
        <ToggleButtonGroup
          size="sm"
          labelText={group.label}
          selected={selectedIn(group.tools.map((t) => t.id))}
          on:change={(e) =>
            setGroup(
              group.tools.map((t) => t.id),
              e.detail,
            )}
        >
          {#each group.tools as tool (tool.id)}
            <ToggleButton
              value={tool.id}
              icon={tool.icon}
              iconDescription={describe(tool)}
              tooltipPosition="top"
            />
          {/each}
        </ToggleButtonGroup>
      {/each}
      <span class="bx--dev-toolbar__divider" aria-hidden="true"></span>
      <Button
        kind="ghost"
        size="small"
        icon={Close}
        iconDescription={shortcuts ? "Collapse (Alt+Shift+D)" : "Collapse"}
        tooltipPosition="top"
        tooltipAlignment="end"
        aria-expanded="true"
        on:click={() => (expanded = false)}
      />
    {:else}
      <!-- The badge sits beside the button, not in its `badge` slot: the
           slot sizes the button to lg, and the bar keeps small buttons.
           The button's name already says how many tools are on. -->
      <span class="bx--btn__badge-wrapper">
        <Button
          kind="ghost"
          size="small"
          icon={Tools}
          iconDescription={`Developer tools${activeCount ? `, ${activeCount} on` : ""}${shortcuts ? " (Alt+Shift+D)" : ""}`}
          tooltipPosition="top"
          tooltipAlignment="end"
          aria-expanded="false"
          on:click={() => (expanded = true)}
        />
        {#if activeCount}
          <BadgeIndicator count={activeCount} aria-hidden="true" />
        {/if}
      </span>
    {/if}
  </TooltipGroup>
</section>

<GridOverlay
  {...gridProps}
  open={tools.grid || tools.baseline || tools.textBaselines}
  columns={tools.grid}
  baseline={tools.baseline ? gridProps.baseline || 8 : 0}
  textBaselines={tools.textBaselines}
  label={gridProps.label ?? (tools.grid || tools.baseline)}
/>
<LayoutInspector
  {...inspectorProps}
  open={inspecting ||
    tools.spacing ||
    tools.contrast ||
    tools.targets ||
    tools.overflow}
  spacing={inspecting}
  typography={inspecting}
  colors={inspecting}
  measure={inspecting}
  checkSpacing={tools.spacing}
  checkContrast={tools.contrast}
  checkTargets={tools.targets}
  checkOverflow={tools.overflow}
/>
