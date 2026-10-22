<svelte:options accessors />

<script lang="ts">
  import Link from "carbon-components-svelte/Link/Link.svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  export let onClick: (event: MouseEvent) => void = () => {};
  export let onMouseover: () => void = () => {};
  export let onMouseenter: () => void = () => {};
  export let onMouseleave: () => void = () => {};
  export let onDisabledClick: () => void = () => {};
</script>

<div data-testid="default-link">
  <Link
    href="https://www.carbondesignsystem.com/"
    on:click={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    on:mouseover={() => onMouseover()}
    on:mouseenter={() => onMouseenter()}
    on:mouseleave={() => onMouseleave()}
  >
    Carbon Design System
  </Link>
</div>

<div data-testid="link-blank">
  <Link href="https://www.carbondesignsystem.com/" target="_blank">
    Carbon Design System
  </Link>
</div>

<div data-testid="link-inline">
  <Link inline href="https://www.carbondesignsystem.com/">
    Carbon Design System
  </Link>
</div>

<div data-testid="link-with-icon">
  <Link href="https://www.carbondesignsystem.com/" icon={Carbon}>
    Carbon Design System
  </Link>
</div>

<div data-testid="link-with-icon-slot">
  <Link href="https://www.carbondesignsystem.com/">
    Carbon Design System
    <svelte:fragment slot="icon"> <Carbon /> </svelte:fragment>
  </Link>
</div>

<div data-testid="link-large">
  <Link size="lg" href="https://www.carbondesignsystem.com/">
    Carbon Design System
  </Link>
</div>

<div data-testid="link-small">
  <Link size="sm" href="https://www.carbondesignsystem.com/">
    Carbon Design System
  </Link>
</div>

<div data-testid="link-disabled">
  <Link
    disabled
    href="https://www.carbondesignsystem.com/"
    on:click={() => onDisabledClick()}
  >
    Carbon Design System
  </Link>
</div>

<div data-testid="link-muted">
  <Link muted inline href="https://www.carbondesignsystem.com/">
    Carbon Design System
  </Link>
</div>

<div data-testid="link-visited">
  <Link visited href="https://www.carbondesignsystem.com/">
    Carbon Design System
  </Link>
</div>

<div data-testid="link-inline-icon">
  <Link inline href="https://www.carbondesignsystem.com/" icon={Carbon}>
    Carbon Design System
  </Link>
</div>

<div data-testid="link-inline-icon-slot">
  <Link inline href="https://www.carbondesignsystem.com/">
    Carbon Design System
    <svelte:fragment slot="icon"> <Carbon /> </svelte:fragment>
  </Link>
</div>
