<script>
  // One passing and one failing case per helper in e2e/helpers/layout.ts.
  // `?wide` adds an element wider than the page.
  const wide = new URLSearchParams(location.search).has("wide");
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
<div class="grid" data-testid="ring-good">
  <span class="cell-ring selected">1</span>
  <span class="cell-ring">2</span>
  <span class="cell-ring">3</span>
</div>
<div class="grid" data-testid="ring-bad">
  <span class="cell-ring outlined">1</span>
  <span class="cell-ring outlined">2</span>
  <span class="cell-ring outlined">3</span>
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
    outline: 1px solid CanvasText;
  }
  .wide {
    width: 150vw;
    height: 1px;
  }
</style>
