<script>
  import { Router, Link, Route } from 'svelte-routing';
  import copy from 'clipboard-copy';
  import { Search, Link as CarbonLink, CodeSnippet } from 'carbon-components-svelte';
  import ThemePicker from './components/ThemePicker.svelte';

  let value = '';

  $: code = `
    search component "${value}"
  `.trim();
</script>

<style>
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    height: 2.5rem;
    padding: 0 1rem;
  }
</style>

<Router>
  <nav>
    <Link to="/">Home</Link>
    <Link to="about">About</Link>
  </nav>
  <div>
    <Route path="about" component={ThemePicker} />
    <Route path="/">Home</Route>
  </div>
</Router>

<header>
  <CarbonLink href="https://github.com/IBM/carbon-components-svelte">GitHub</CarbonLink>
  <div>
    <ThemePicker />
  </div>
</header>

<div style="width: 16rem">
  <Search id="search-components" labelText="Components" small bind:value />
</div>

<CodeSnippet
  on:click={() => {
    copy(code);
  }}
  {code} />
