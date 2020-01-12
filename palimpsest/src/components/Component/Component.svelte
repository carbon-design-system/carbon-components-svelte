<script context="module">
  import Accordion from '../carbon-components/Accordion';
  import CodeSnippet from '../carbon-components/CodeSnippet';

  export const components = {
    Accordion,
    CodeSnippet
  };
</script>

<script>
  import { afterUpdate, setContext } from 'svelte';
  import { Tabs, Tab } from 'carbon-components-svelte';
  import { push, location } from 'svelte-spa-router';
  import Router from 'svelte-spa-router';
  import ComponentTab from './ComponentTab.svelte';

  const prefix = '/c';
  const urls = [{ path: '' }, { path: '/API' }, { path: '/kitchen-sink' }];

  let selected = 0;
  let component = undefined;
  let prevComponent = undefined;

  setContext('Component', {
    set: name => {
      component = name;
    }
  });

  afterUpdate(() => {
    if (component !== prevComponent && prevComponent !== undefined) {
      window.scrollTo(0, 0);
    }

    prevComponent = component;
  });

  $: baseUrl = component ? `#${prefix}/${component}` : $location;
  $: {
    switch (
      $location
        .split('/')
        .pop()
        .toLowerCase()
    ) {
      case 'api':
        selected = 1;
        break;
      case 'kitchen-sink':
        selected = 2;
        break;
      default:
        selected = 0;
        break;
    }
  }
</script>

<style>
  main {
    margin-top: 5rem;
    padding-left: 12rem;
    padding-bottom: 2.5rem;
  }

  @media screen and (max-width: 768px) {
    main {
      padding-left: 0;
    }
  }

  h1 {
    margin-bottom: 1.5rem;
  }

  .bx--grid {
    max-width: 66rem;
  }

  :global(body) {
    overflow-y: scroll;
  }
</style>

<main>
  <div class="bx--grid">
    <header class="bx--row">
      <div class="bx--col">
        <h1>{component}</h1>
      </div>
    </header>
    <div class="bx--row">
      <div class="bx--col bx--no-gutter">
        <Tabs
          type="container"
          bind:selected
          on:change={({ detail }) => {
            push(`${prefix}/${component}${urls[detail].path}`);
          }}>
          <Tab label="Preview" href={baseUrl} />
          <Tab label="API" href={`${baseUrl}/API`} />
          <!-- <Tab disabled label="Kitchen Sink" href={`${baseUrl}/kitchen-sink`} /> -->
        </Tabs>
      </div>
    </div>
  </div>
  <section class="bx--grid">
    <Router {prefix} routes={{ '/:name': ComponentTab, '/:name/:tab': ComponentTab }} />
  </section>
</main>
