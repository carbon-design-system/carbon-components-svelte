<script>
  export let params = {};

  import { Tabs, Tab } from 'carbon-components-svelte';
  import CodeSnippet from './carbon-components/CodeSnippet.svelte';

  const registry = {
    CodeSnippet
  };

  let selected = 0;
</script>

<style>
  main {
    margin-top: 2.5rem;
    padding-top: 3rem;
  }

  header {
    border-bottom: 1px solid var(--cds-ui-03);
  }

  h1 {
    margin-bottom: 1.5rem;
  }

  .bx--grid {
    padding-left: 16rem;
  }
</style>

<main>
  <div class="bx--grid">
    <header class="bx--row">
      <div class="bx--col">
        <h1>{params.name}</h1>
      </div>
      <Tabs type="container" bind:selected>
        <Tab label="Overview" />
        <Tab label="API" />
        <Tab label="Kitchen Sink" />
      </Tabs>
    </header>
  </div>
  <section class="bx--grid">
    <svelte:component this={registry[params.name]} {selected} />
  </section>
</main>
