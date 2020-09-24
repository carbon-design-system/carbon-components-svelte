<script>
  export let segment = undefined;

  import {
    SkipToContent,
    Header,
    HeaderNav,
    HeaderNavItem,
    HeaderUtilities,
    HeaderActionLink,
  } from "carbon-components-svelte";
  import Theme from "./Theme.svelte";
</script>

<Header
  company="Carbon"
  platformName="Components Svelte"
  href="."
  rel="prefetch"
  aria-current="{segment === undefined ? 'page' : undefined}"
>
  <SkipToContent />
  <!-- <HeaderNav>
    <HeaderNavItem
      rel="prefetch"
      href="about"
      text="About"
      aria-current={segment === 'about' ? 'page' : undefined} />
    <HeaderNavItem
      rel="prefetch"
      href="components"
      text="Components"
      aria-current={segment === 'components' ? 'page' : undefined} />
  </HeaderNav> -->
</Header>
