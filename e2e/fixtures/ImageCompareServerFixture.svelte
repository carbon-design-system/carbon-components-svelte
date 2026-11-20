<script>
  import { ImageCompare } from "carbon-components-svelte";
</script>

<!-- Rendered on the server by e2e/image-compare.test.ts, and mounted here. -->
<div style="max-width: 600px;">
  <div data-testid="ltr">
    <ImageCompare value={30} ratio="2x1">
      <p slot="before">Before side</p>
      <p slot="after">After side</p>
    </ImageCompare>
  </div>
  <div data-testid="rtl" dir="rtl">
    <ImageCompare value={30} ratio="2x1">
      <p slot="before">Before side</p>
      <p slot="after">After side</p>
    </ImageCompare>
  </div>
  <div data-testid="vertical">
    <ImageCompare value={30} ratio="2x1" orientation="vertical">
      <p slot="before">Before side</p>
      <p slot="after">After side</p>
    </ImageCompare>
  </div>
</div>
