<script>
  import { link, location } from 'svelte-spa-router';
  import { Search } from 'carbon-components-svelte';
  import Fuse from 'fuse.js';
  import components from '../data/component-registry';

  const fuse = new Fuse(components, { shouldSort: false, keys: ['name'] });

  let value = '';

  $: results = value.length > 1 ? fuse.search(value) : components;
</script>

<style>
  ul {
    padding: 0.5rem 0;
  }

  li {
    display: flex;
  }

  .bx--link {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 0.375rem 1rem;
    color: var(--cds-text-01);
    text-decoration: none;
  }

  .bx--link:focus {
    z-index: 1;
  }

  .bx--link:hover {
    background-color: var(--cds-ui-03);
    color: var(--cds-text-01);
  }

  .bx--link.current {
    background-color: var(--cds-ui-03);
    font-weight: 600;
  }

  .bx--link.current:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 0.25rem;
    height: 100%;
    background-color: var(--cds-interactive-01);
  }
</style>

<Search small id="search-components" labelText="Components" bind:value />
<ul>
  {#each results as { name }, i (name)}
    <li>
      <a class="bx--link" class:current={$location === `/c/${name}`} href={`/c/${name}`} use:link>
        {name}
      </a>
    </li>
  {/each}
</ul>
