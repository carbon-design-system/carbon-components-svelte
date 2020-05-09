<script>
  export let segment;

  import {
    Button,
    Header,
    HeaderNav,
    HeaderNavItem
  } from "carbon-components-svelte";

  $: {
    console.log(segment);
  }
</script>

<Header company="" platformName="Carbon Components Svelte" href="/">
  <HeaderNav>
    <HeaderNavItem href="/about" text="Link 1" />
  </HeaderNav>
</Header>
