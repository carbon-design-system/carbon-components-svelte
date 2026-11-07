<script>
  import { ImageCompare } from "carbon-components-svelte";
  import { dashboard, grid, photo, screen } from "./image-compare-images";

  let value = 50;
  let selected = "before";
  let changes = 0;
</script>

<div style="max-width: 600px; padding: 1rem;">
  <p data-testid="value-display">{value}</p>
  <p data-testid="selected-display">{selected}</p>
  <p data-testid="change-count">{changes}</p>

  <ImageCompare
    data-testid="slider"
    labelText="Denoised photo"
    beforeSrc={photo(false)}
    afterSrc={photo(true)}
    beforeAlt="Noisy, flat photo of mountains at dusk"
    afterAlt="Denoised photo with vivid color"
    bind:value
    on:change={() => changes++}
  />

  <p>Text between the comparisons keeps the page scrollable.</p>
  <div style="height: 900px;"></div>

  <ImageCompare
    data-testid="vertical"
    orientation="vertical"
    ratio="4x3"
    beforeSrc={screen(false, 800, 600)}
    afterSrc={screen(true, 800, 600)}
    beforeAlt="Old settings page"
    afterAlt="Redesigned settings page"
    beforeLabel="Old"
    afterLabel="New"
  />

  <ImageCompare
    data-testid="toggle"
    mode="toggle"
    bind:selected
    beforeSrc={dashboard(false)}
    afterSrc={dashboard(true)}
    beforeAlt="Baseline screenshot"
    afterAlt="Current screenshot"
    beforeLabel="Baseline"
    afterLabel="Current"
  />

  <ImageCompare
    data-testid="side-by-side"
    mode="side-by-side"
    beforeSrc={photo(false)}
    afterSrc={photo(true)}
  />

  <ImageCompare
    data-testid="mismatch"
    ratio="2x1"
    beforeSrc={grid(400, 300, "#0f62fe")}
    afterSrc={grid(1000, 200, "#198038")}
    beforeAlt="A 4:3 image"
    afterAlt="A 5:1 image"
  />

  <ImageCompare
    data-testid="quiet"
    beforeSrc={photo(false)}
    afterSrc={photo(true)}
  />

  <ImageCompare data-testid="slots" ratio="2x1" value={30}>
    <div
      slot="before"
      style="display: grid; place-items: center; width: 100%; height: 100%; background: #e0e0e0;"
    >
      Q1 revenue
    </div>
    <div
      slot="after"
      style="display: grid; place-items: center; width: 100%; height: 100%; background: #a7f0ba;"
    >
      Q2 revenue
    </div>
  </ImageCompare>
</div>
