<script>
  /**
   * @typedef {"grid" | "baseline" | "textBaselines" | "inspect" | "lint" | "contrast" | "targets" | "overflow" | "rtl"} DevToolbarTool
   * @typedef {Record<DevToolbarTool, boolean>} DevToolbarTools
   * @restProps {div}
   */

  /**
   * Which tools are on.
   * Bind to read or set them from outside, for example to turn on a preset.
   * @type {DevToolbarTools}
   * @bindable
   */
  export let tools = {
    grid: false,
    baseline: false,
    textBaselines: false,
    inspect: false,
    lint: false,
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
   * @type {Record<string, any>}
   */
  export let gridProps = {};

  /**
   * Props passed to the `LayoutInspector` the toolbar renders, for example `{ measureKey: "Shift", cardPlacement: "corner" }`.
   * The toolbar sets `open` and the props for each tool.
   * @type {Record<string, any>}
   */
  export let inspectorProps = {};

  import { onMount } from "svelte";
  import BadgeIndicator from "../BadgeIndicator/BadgeIndicator.svelte";
  import Button from "../Button/Button.svelte";
  import GridOverlay from "../Grid/GridOverlay.svelte";
  import Close from "../icons/Close.svelte";
  import Contrast from "../icons/Contrast.svelte";
  import FitToWidth from "../icons/FitToWidth.svelte";
  import GridIcon from "../icons/GridIcon.svelte";
  import Inspection from "../icons/Inspection.svelte";
  import Ruler from "../icons/Ruler.svelte";
  import TextAlignRight from "../icons/TextAlignRight.svelte";
  import TextLineSpacing from "../icons/TextLineSpacing.svelte";
  import TextVerticalAlignment from "../icons/TextVerticalAlignment.svelte";
  import Tools from "../icons/Tools.svelte";
  import TouchInteraction from "../icons/TouchInteraction.svelte";
  import LayoutInspector from "../LayoutInspector/LayoutInspector.svelte";
  import ToggleButton from "../ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "../ToggleButtonGroup/ToggleButtonGroup.svelte";

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
    { id: "lint", icon: Ruler, key: "L", title: "Off-scale spacing" },
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
      ids: ["inspect", "lint", "contrast", "targets", "overflow"],
    },
    { label: "Direction", ids: ["rtl"] },
  ].map((group) => ({
    label: group.label,
    tools: TOOLS.filter((t) => group.ids.includes(t.id)),
  }));

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
  }

  let mounted = false;

  /** @param {DevToolbarTool} id */
  function toggle(id) {
    tools = { ...tools, [id]: !tools[id] };
  }

  onMount(() => {
    if (persist) {
      try {
        const saved = JSON.parse(localStorage.getItem(persistKey) ?? "null");
        if (saved?.tools) tools = { ...tools, ...saved.tools };
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

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    if (!shortcuts || !e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) {
      return;
    }
    const target = /** @type {HTMLElement | null} */ (e.target);
    if (
      target?.isContentEditable ||
      target?.closest?.("input, textarea, select")
    ) {
      return;
    }
    // `code`, not `key`: Option+Shift on macOS turns letters into symbols.
    const letter = e.code.startsWith("Key") ? e.code.slice(3) : "";
    if (letter === "D") {
      e.preventDefault();
      expanded = !expanded;
      return;
    }
    const tool = TOOLS.find((t) => t.key === letter);
    if (tool) {
      e.preventDefault();
      toggle(tool.id);
    }
  }

  $: activeCount = TOOLS.filter((t) => tools[t.id]).length;
  $: inspecting = tools.inspect;
  $: toolbarClass = [$$restProps.class, "bx--dev-toolbar"]
    .filter(Boolean)
    .join(" ");
</script>

<svelte:window on:keydown={onKeydown} />

<section
  aria-label="Developer tools"
  {...$$restProps}
  class={toolbarClass}
  data-ccs-devtools
>
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
    <Button
      kind="ghost"
      size="small"
      icon={Tools}
      iconDescription={`Developer tools${activeCount ? `, ${activeCount} on` : ""}${shortcuts ? " (Alt+Shift+D)" : ""}`}
      tooltipPosition="top"
      tooltipAlignment="end"
      aria-expanded="false"
      on:click={() => (expanded = true)}
    >
      {#if activeCount}
        <BadgeIndicator slot="badge" count={activeCount} />
      {/if}
    </Button>
  {/if}
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
    tools.lint ||
    tools.contrast ||
    tools.targets ||
    tools.overflow}
  spacing={inspecting}
  type={inspecting}
  colors={inspecting}
  measure={inspecting}
  lint={tools.lint}
  contrast={tools.contrast}
  targets={tools.targets}
  overflow={tools.overflow}
/>
