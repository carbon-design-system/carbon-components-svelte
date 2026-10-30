<script>
  // One passing and one failing case per helper in e2e/helpers/layout.ts.
  // `?wide` adds an element wider than the page.
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import AnchoredTooltip from "carbon-components-svelte/Portal/AnchoredTooltip.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";
  import Edit from "carbon-components-svelte/icons/Edit.svelte";
  import { titleWhenTruncated } from "carbon-components-svelte/utils/title-when-truncated.js";

  const wide = new URLSearchParams(location.search).has("wide");
  const host = "Load balancer in eu-central-1";

  let tipAnchor = null;
  let wrongTipAnchor = null;

  /** A hover handler that sets a `title` without the full text. */
  function shortTitle(node) {
    const set = () => node.setAttribute("title", "Load balancer");
    node.addEventListener("mouseenter", set);
    return { destroy: () => node.removeEventListener("mouseenter", set) };
  }
</script>

<!-- expectAligned -->
<div class="row" data-testid="aligned-top-good">
  <div class="box"></div>
  <div class="box tall"></div>
  <div class="box"></div>
</div>
<div class="row" data-testid="aligned-top-bad">
  <div class="box"></div>
  <div class="box tall"></div>
  <div class="box low" data-testid="aligned-top-off"></div>
</div>
<div class="row baseline" data-testid="aligned-baseline-good">
  <input class="field" value="billing" />
  <span class="small">Region</span>
  <span class="large">Large</span>
</div>
<div class="row" data-testid="aligned-baseline-bad">
  <input class="field" value="billing" />
  <span class="small">Region</span>
  <span class="large" data-testid="aligned-baseline-off">Large</span>
</div>
<div dir="rtl" data-testid="aligned-start-good">
  <div class="bar"></div>
  <div class="bar short"></div>
</div>
<div dir="rtl" data-testid="aligned-start-bad">
  <div class="bar"></div>
  <div class="bar short indent" data-testid="aligned-start-off"></div>
</div>
<!-- Padding and margin put the boxes 16px apart; the text lines up. -->
<div data-testid="aligned-ink-good">
  <h3 class="padded">Overview</h3>
  <h3 class="indented">Details</h3>
  <div class="padded ink-icon"><Edit /></div>
</div>
<div data-testid="aligned-ink-bad">
  <h3 class="padded">Overview</h3>
  <h3 class="indented off" data-testid="aligned-ink-off">Details</h3>
</div>

<!-- expectOnePitch -->
<ul data-testid="pitch-good">
  <li class="line">One</li>
  <li class="line">Two</li>
  <li class="line">Three</li>
</ul>
<ul data-testid="pitch-bad">
  <li class="line">One</li>
  <li class="line">Two</li>
  <li class="line extra" data-testid="pitch-off">Three</li>
  <li class="line">Four</li>
</ul>
<ul data-testid="pitch-off-grid">
  <li class="line shared">One</li>
  <li class="line shared">Two</li>
  <li class="line shared">Three</li>
</ul>
<!-- A virtualized grid: a frozen header, the spacer for rows scrolled
     past, a group row, and a range selection drawn as an overlay. -->
<div class="vgrid" data-testid="pitch-grid">
  <div class="vrow frozen">Name</div>
  <div class="vrow spacer" aria-hidden="true"></div>
  <div class="vrow group">Group A</div>
  <div class="vrow">Row 4</div>
  <div class="vrow">Row 5</div>
  <div class="vrow range"></div>
  <div class="vrow">Row 6</div>
</div>
<div class="vgrid" data-testid="pitch-grid-bad">
  <div class="vrow frozen">Name</div>
  <div class="vrow spacer" aria-hidden="true"></div>
  <div class="vrow">Row 4</div>
  <div class="vrow extra" data-testid="pitch-grid-off">Row 5</div>
  <div class="vrow">Row 6</div>
  <div class="vrow">Row 7</div>
</div>

<!-- expectTextFits -->
<div data-testid="fits-good">
  <p class="cell">Short</p>
  <p class="cell clip" title="Load balancer in eu-central-1">
    Load balancer in eu-central-1
  </p>
</div>
<div data-testid="fits-overflow">
  <p class="cell nowrap" data-testid="fits-spill">
    Load balancer in eu-central-1
  </p>
</div>
<div data-testid="fits-no-title">
  <p class="cell clip" data-testid="fits-untitled">
    Load balancer in eu-central-1
  </p>
</div>
<div data-testid="fits-cut-number">
  <p class="digits clip" data-testid="fits-cut" title="12345678901234567890">
    12345678901234567890
  </p>
</div>

<div data-testid="fits-hover-good">
  <p class="cell clip" use:titleWhenTruncated>{host}</p>
  <p class="cell clip" bind:this={tipAnchor}>{host}</p>
  <AnchoredTooltip anchor={tipAnchor} text={host} />
</div>
<div data-testid="fits-hover-title-bad">
  <p class="cell clip" data-testid="fits-short-title" use:shortTitle>
    {host}
  </p>
</div>
<div data-testid="fits-hover-tooltip-bad">
  <p class="cell clip" data-testid="fits-wrong-tip" bind:this={wrongTipAnchor}>
    {host}
  </p>
  <AnchoredTooltip anchor={wrongTipAnchor} text="Load balancer" />
</div>
<!-- Labels hidden on purpose: placed wholly outside a box that clips
     them, in a 1px box, and under the library's hidden class. -->
<div data-testid="fits-hidden-good">
  <p class="cell">Short</p>
  <div class="clip-box"><span class="outside">{host}</span></div>
  <span class="one-px">{host}</span>
  <span class="bx--visually-hidden unclipped">{host}</span>
</div>
<div data-testid="fits-hidden-bad">
  <div class="clip-box">
    <span class="partly" data-testid="fits-partly">{host}</span>
  </div>
</div>

<!-- expectNoNestedBorders -->
<div class="frame" data-testid="borders-good">
  <div class="frame layer">On a new layer</div>
</div>
<div class="frame" data-testid="borders-bad">
  <div class="frame" data-testid="borders-inner">Same layer</div>
</div>
<div class="frame" data-testid="rings-good">
  <div class="outline layer">Outline on a new layer</div>
  <div class="elevated">Elevation shadow</div>
  <div class="underline">Inset underline</div>
  <div class="outline-transparent">Transparent outline</div>
  <button type="button" class="focus-ring" data-testid="rings-focus"
    >Focus ring</button
  >
</div>
<div class="frame" data-testid="rings-forced">
  <div class="outline-transparent" data-testid="rings-transparent">
    Transparent outline
  </div>
</div>
<!-- A focused listbox rings its current option and keeps focus itself. -->
<div class="frame" data-testid="rings-active">
  <div
    role="listbox"
    tabindex="0"
    aria-label="Active descendant"
    aria-activedescendant="rings-active-2"
    class="focus-ring"
    data-testid="rings-active-listbox"
  >
    <div role="option" id="rings-active-1" aria-selected="false">One</div>
    <div
      role="option"
      id="rings-active-2"
      aria-selected="false"
      class="outline"
    >
      Two
    </div>
  </div>
</div>
<div class="frame" data-testid="rings-selected">
  <div
    role="listbox"
    tabindex="0"
    aria-label="Selected option"
    class="focus-ring"
    data-testid="rings-selected-listbox"
  >
    <div role="option" aria-selected="false">One</div>
    <div role="option" aria-selected="true" class="outline">Two</div>
  </div>
</div>
<div class="frame" data-testid="rings-active-bad">
  <div
    role="listbox"
    tabindex="0"
    aria-label="Ring on another option"
    aria-activedescendant="rings-other-1"
    class="focus-ring"
    data-testid="rings-active-bad-listbox"
  >
    <div role="option" id="rings-other-1" aria-selected="false">One</div>
    <div role="option" id="rings-other-2" aria-selected="false" class="outline">
      Two
    </div>
  </div>
</div>
<div class="frame" data-testid="rings-bad">
  <div class="outline" data-testid="rings-outline">Outline</div>
  <div class="shadow-inset" data-testid="rings-inset">Inset shadow ring</div>
  <div class="shadow-spread" data-testid="rings-spread">Spread shadow ring</div>
</div>

<!-- expectSingleRing, under forced colors -->
<!-- 1px boxes, as on ActionBar buttons, are resting edges. -->
<div class="grid" data-testid="ring-good">
  <span class="cell-ring selected">1</span>
  <span class="cell-ring boxed">2</span>
  <span class="cell-ring boxed">3</span>
</div>
<div class="grid" data-testid="ring-bad">
  <span class="cell-ring outlined">1</span>
  <span class="cell-ring outlined">2</span>
  <span class="cell-ring outlined">3</span>
</div>
<!-- Each icon Button holds a tooltip hidden with `clip`. -->
<div class="grid" data-testid="ring-toolbar">
  {#each ["Edit", "Copy", "Move", "Rename", "Share", "Delete"] as label}
    <Button kind="ghost" size="small" icon={Edit} iconDescription={label} />
  {/each}
</div>
<!-- A selected tile holding child components: a field's resting box is
     structural, and a focused Toggle draws its own ring. -->
<div class="tile" data-testid="ring-children">
  <span class="cell-ring selected">Selected</span>
  <Toggle labelText="Notify" />
  <TextInput labelText="Name" />
  <Button kind="ghost" size="small" icon={Edit} iconDescription="Edit" />
</div>
<!-- One selection shown in two panes, as a Gantt shows its list and bars.
     Each item draws its ring with an outline and a `::before`. -->
<div class="grid" data-testid="ring-panes">
  <ul class="pane">
    <li class="item">Task 1</li>
    <li class="item picked">Task 2</li>
  </ul>
  <div class="pane">
    <div class="item">Bar 1</div>
    <div class="item picked">Bar 2</div>
  </div>
</div>
<div class="grid" data-testid="ring-panes-bad">
  <ul class="pane" data-testid="ring-pane-off">
    <li class="item picked">Task 1</li>
    <li class="item picked">Task 2</li>
  </ul>
  <div class="pane">
    <div class="item">Bar 1</div>
    <div class="item picked">Bar 2</div>
  </div>
</div>

<!-- expectNoPageOverflow -->
{#if wide}
  <div class="wide" data-testid="overflow-wide"></div>
{/if}

<style>
  .row {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .row.baseline {
    align-items: baseline;
  }
  .box {
    width: 2rem;
    height: 2rem;
    background: #8d8d8d;
  }
  .tall {
    height: 3rem;
  }
  .low {
    margin-top: 3px;
  }
  .field {
    height: 2.5rem;
    padding: 0 1rem;
    font-size: 0.875rem;
  }
  .small {
    font-size: 0.75rem;
  }
  .large {
    font-size: 2rem;
  }
  .bar {
    width: 10rem;
    height: 0.5rem;
    margin-bottom: 0.25rem;
    background: #8d8d8d;
  }
  .short {
    width: 6rem;
  }
  .indent {
    margin-inline-start: 2px;
  }
  ul {
    margin-bottom: 1rem;
  }
  .line {
    height: 2rem;
  }
  .extra {
    height: 2.5rem;
  }
  .shared {
    height: 2rem;
    margin-top: -1px;
    border-top: 1px solid;
  }
  .cell {
    width: 6rem;
    margin-bottom: 0.5rem;
  }
  .nowrap {
    white-space: nowrap;
  }
  .clip {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .digits {
    width: 10ch;
    font-family: monospace;
  }
  .frame {
    margin-bottom: 1rem;
    padding: 0.5rem;
    border: 1px solid #8d8d8d;
  }
  .layer {
    background: #f4f4f4;
  }
  .outline {
    outline: 2px solid #8d8d8d;
    outline-offset: -2px;
  }
  .outline-transparent {
    outline: 2px solid transparent;
    outline-offset: -2px;
  }
  .elevated {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
  .underline {
    box-shadow: inset 0 -1px 0 #8d8d8d;
  }
  .shadow-inset {
    box-shadow: inset 0 0 0 1px #8d8d8d;
  }
  .shadow-spread {
    box-shadow: 0 0 0 1px #8d8d8d;
  }
  .focus-ring:focus {
    outline: 2px solid #0f62fe;
  }
  .grid {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .cell-ring {
    padding: 0.5rem;
  }
  .selected {
    border: 2px solid Highlight;
  }
  .outlined {
    outline: 2px solid CanvasText;
  }
  .boxed {
    outline: 1px solid CanvasText;
  }
  .padded {
    padding-inline-start: 1rem;
  }
  .indented {
    margin-inline-start: 1rem;
  }
  .indented.off {
    margin-inline-start: 1.125rem;
  }
  .vgrid {
    margin-bottom: 1rem;
  }
  .vrow {
    height: 2rem;
  }
  .frozen {
    position: sticky;
    top: 0;
    height: 3rem;
  }
  .spacer {
    height: 6rem;
  }
  .group {
    height: 3rem;
  }
  .vrow.extra {
    height: 2.5rem;
  }
  .range {
    position: absolute;
    width: 10rem;
    height: 4rem;
    margin-top: -4rem;
    outline: 2px solid Highlight;
  }
  .clip-box {
    position: relative;
    width: 6rem;
    height: 1.5rem;
    margin-bottom: 0.5rem;
    overflow: hidden;
  }
  .outside,
  .partly {
    position: absolute;
    white-space: nowrap;
  }
  .outside {
    inset-inline-start: 100%;
  }
  .partly {
    inset-inline-start: 3rem;
  }
  .one-px {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    white-space: nowrap;
  }
  .unclipped {
    clip: auto;
    width: 2rem;
    height: 1rem;
  }
  .tile {
    margin-bottom: 1rem;
    padding: 1rem;
  }
  .pane {
    flex: 1;
  }
  .item {
    position: relative;
    padding: 0.5rem;
  }
  .picked {
    outline: 2px solid Highlight;
  }
  .picked::before {
    content: "";
    position: absolute;
    inset: 0;
    border: 1px solid Highlight;
  }
  .wide {
    width: 150vw;
    height: 1px;
  }
</style>
