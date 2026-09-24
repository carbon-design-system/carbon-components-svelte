<svelte:options accessors />

<script lang="ts">
  import Content from "../../src/UIShell/Content.svelte";
  import SideNav from "../../src/UIShell/SideNav.svelte";
  import SideNavItems from "../../src/UIShell/SideNavItems.svelte";
  import SideNavLink from "../../src/UIShell/SideNavLink.svelte";

  export let resizable = false;
  export let rail = false;
  export let width: number | undefined = undefined;
  export let minWidth = 200;
  export let maxWidth = 480;
  export let resizeHandleLabel: string | undefined = undefined;
  export let onResize: ((detail: { width: number }) => void) | undefined =
    undefined;
</script>

<span data-testid="width">{width}</span>
<SideNav
  {resizable}
  {rail}
  bind:width
  {minWidth}
  {maxWidth}
  {resizeHandleLabel}
  isOpen
  fixed
  on:resize={(e) => onResize?.(e.detail)}
>
  <SideNavItems>
    <SideNavLink text="First" href="/first" />
  </SideNavItems>
</SideNav>
<Content>Content</Content>
