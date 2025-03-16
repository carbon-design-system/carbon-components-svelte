<svelte:options accessors />

<script lang="ts">
  import { Link } from "carbon-components-svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";
</script>

<!-- Default link -->
<div data-testid="default-link">
  <Link
    href="https://www.carbondesignsystem.com/"
    on:click={(e) => {
      e.preventDefault();
      console.log("click");
    }}
    on:mouseover={() => {
      console.log("mouseover");
    }}
    on:mouseenter={() => {
      console.log("mouseenter");
    }}
    on:mouseleave={() => {
      console.log("mouseleave");
    }}
  >
    Carbon Design System
  </Link>
</div>

<!-- Link with target _blank -->
<div data-testid="link-blank">
  <Link href="https://www.carbondesignsystem.com/" target="_blank">
    Carbon Design System
  </Link>
</div>

<!-- Inline link -->
<div data-testid="link-inline">
  <Link inline href="https://www.carbondesignsystem.com/">
    Carbon Design System
  </Link>
</div>

<!-- Link with icon -->
<div data-testid="link-with-icon">
  <Link href="https://www.carbondesignsystem.com/" icon={Carbon}>
    Carbon Design System
  </Link>
</div>

<!-- Link with icon slot -->
<div data-testid="link-with-icon-slot">
  <Link href="https://www.carbondesignsystem.com/">
    Carbon Design System
    <svelte:fragment slot="icon">
      <Carbon />
    </svelte:fragment>
  </Link>
</div>

<!-- Large link -->
<div data-testid="link-large">
  <Link size="lg" href="https://www.carbondesignsystem.com/">
    Carbon Design System
  </Link>
</div>

<!-- Small link -->
<div data-testid="link-small">
  <Link size="sm" href="https://www.carbondesignsystem.com/">
    Carbon Design System
  </Link>
</div>

<!-- Disabled link -->
<div data-testid="link-disabled">
  <Link disabled href="https://www.carbondesignsystem.com/">
    Carbon Design System
  </Link>
</div>

<!-- Visited link -->
<div data-testid="link-visited">
  <Link visited href="https://www.carbondesignsystem.com/">
    Carbon Design System
  </Link>
</div>
