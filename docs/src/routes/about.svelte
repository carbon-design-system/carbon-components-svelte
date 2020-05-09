<script>
  import {
    Button,
    Header,
    HeaderNav,
    HeaderNavItem
  } from "carbon-components-svelte";
  import { theme } from "../store";
</script>

<svelte:head>
  <title>About</title>
</svelte:head>
<h1>About this site</h1>
{$theme}
<Button>Hello world</Button>

<p>This is the 'about' page. There's not much here.</p>
