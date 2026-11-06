<script>
  import {
    Button,
    TooltipDefinition,
    TooltipIcon,
  } from "carbon-components-svelte";
  import Edit from "carbon-components-svelte/icons/Edit.svelte";
  import Information from "carbon-components-svelte/icons/Information.svelte";
  import { onMount } from "svelte";

  const text = "Requests in the last 30 days, summed across every region";

  const DIRECTIONS = ["top", "bottom", "left", "right"];
  const ALIGNS = ["start", "center", "end"];
  const COMPONENTS = ["TooltipIcon", "Button", "TooltipDefinition"];
  // Where the trigger sits, a few px in from the edge or corner of the
  // window. `none` is the middle.
  const EDGES = {
    none: "top: 50%; left: 50%",
    top: "top: 0.25rem; left: 50%",
    bottom: "bottom: 0.25rem; left: 50%",
    left: "left: 0.25rem; top: 50%",
    right: "right: 0.25rem; top: 50%",
    "top-left": "top: 0.25rem; left: 0.25rem",
    "top-right": "top: 0.25rem; right: 0.25rem",
    "bottom-left": "bottom: 0.25rem; left: 0.25rem",
    "bottom-right": "bottom: 0.25rem; right: 0.25rem",
  };

  // `?direction=right&align=start&edge=top-left&component=Button` opens one
  // case: the trigger sits at that edge or corner of the window, with its
  // tooltip open. Add `dir=rtl` or `theme=g100` to see it in right-to-left
  // layout or Gray 100. `?index` lists every case. With none of these, the
  // fixture shows the default pair of triggers at the top and bottom edges.
  const params = new URLSearchParams(location.search);
  const index = params.has("index");
  const parametric = ["direction", "align", "edge", "component"].some((name) =>
    params.has(name),
  );

  function pick(name, values, fallback) {
    const value = params.get(name);
    return values.includes(value) ? value : fallback;
  }

  const direction = pick("direction", DIRECTIONS, "right");
  const align = pick("align", ALIGNS, "center");
  const edge = pick("edge", Object.keys(EDGES), "none");
  const component = pick("component", COMPONENTS, "TooltipIcon");
  const rtl = params.get("dir") === "rtl";
  const theme = params.get("theme");

  // TooltipDefinition opens above or below its trigger only.
  const supported = (c, d) =>
    c !== "TooltipDefinition" || d === "top" || d === "bottom";

  let trigger;

  onMount(() => {
    if (rtl) document.documentElement.setAttribute("dir", "rtl");
    if (theme) document.documentElement.setAttribute("theme", theme);
    if (parametric) {
      trigger?.querySelector(".bx--btn, .bx--tooltip__trigger")?.focus();
    }
  });
</script>

{#if index}
  <main style="padding: 1rem">
    <h1>Portalled tooltips at the window edge</h1>
    <p>
      Rows are the trigger's edge, columns the tooltip's alignment. Add
      <code>&amp;dir=rtl</code> or <code>&amp;theme=g100</code> to a link.
    </p>
    {#each COMPONENTS as c}
      {#each DIRECTIONS as d}
        {#if supported(c, d)}
          <h2>{c}, direction {d}</h2>
          <table>
            <tbody>
              {#each Object.keys(EDGES) as e}
                <tr>
                  <th scope="row">{e}</th>
                  {#each ALIGNS as a}
                    <td>
                      <a href="?direction={d}&align={a}&edge={e}&component={c}"
                        >{a}</a
                      >
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      {/each}
    {/each}
  </main>
{:else if parametric}
  {#if supported(component, direction)}
    <div
      style="position: fixed; {EDGES[edge]}"
      bind:this={trigger}
      data-testid="trigger"
    >
      {#if component === "TooltipIcon"}
        <TooltipIcon
          icon={Information}
          tooltipText={text}
          {direction}
          {align}
          portalTooltip
        />
      {:else if component === "Button"}
        <Button
          kind="ghost"
          size="small"
          icon={Edit}
          iconDescription={text}
          tooltipPosition={direction}
          tooltipAlignment={align}
          portalTooltip
        />
      {:else}
        <TooltipDefinition tooltipText={text} {direction} {align} portalTooltip
          >Quota</TooltipDefinition
        >
      {/if}
    </div>
  {:else}
    <p style="padding: 1rem" data-testid="unsupported">
      TooltipDefinition opens above or below its trigger only, so there is no {direction}
      case.
    </p>
  {/if}
{:else}
  <!-- A portalled tooltip beside its trigger, with the trigger at the top
       and at the bottom edge of the window. A tooltip centered on the
       trigger there runs past the edge. -->
  <div
    style="position: fixed; top: 0.25rem; left: 4rem; display: flex; gap: 8rem"
  >
    <span data-testid="TooltipIcon-top">
      <TooltipIcon
        icon={Information}
        tooltipText={text}
        direction="right"
        portalTooltip
      />
    </span>
    <span data-testid="Button-top">
      <Button
        kind="ghost"
        size="small"
        icon={Edit}
        iconDescription={text}
        tooltipPosition="right"
        portalTooltip
      />
    </span>
  </div>

  <div
    style="position: fixed; bottom: 0.25rem; left: 4rem; display: flex; gap: 8rem"
  >
    <span data-testid="TooltipIcon-bottom">
      <TooltipIcon
        icon={Information}
        tooltipText={text}
        direction="right"
        portalTooltip
      />
    </span>
    <span data-testid="Button-bottom">
      <Button
        kind="ghost"
        size="small"
        icon={Edit}
        iconDescription={text}
        tooltipPosition="right"
        portalTooltip
      />
    </span>
  </div>
{/if}
