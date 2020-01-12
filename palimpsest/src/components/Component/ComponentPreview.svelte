<script>
  export let minHeight = '11.5rem';
  export let light = false;
  export let code = '';

  import copy from 'clipboard-copy';
  import { CodeSnippet } from 'carbon-components-svelte';
  import { theme } from '../../store';

  $: code = code.trim().replace(/< \//g, '</');
  $: light = light && ['white', 'g10'].includes($theme);
</script>

<style>
  .preview {
    position: relative;
    z-index: 1;
    border: 1px solid var(--cds-ui-03);
  }

  .preview.light {
    background-color: var(--cds-ui-01);
  }

  .grid {
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .grid--row {
    display: flex;
    height: 100%;
  }

  .grid--col:not(:last-of-type) {
    border-right: 1px dashed var(--cds-ui-03);
  }

  .grid--col.light {
    background-color: var(--cds-ui-01);
  }

  .grid--col--outer {
    display: flex;
    height: 100%;
  }

  .grid--col--inner {
    flex: 1;
    background-color: var(--cds-ui-background);
  }

  .grid--col--inner {
    border-left: 1px dashed var(--cds-ui-03);
    border-right: 1px dashed var(--cds-ui-03);
  }

  .grid--col--inner.light {
    background-color: var(--cds-ui-01);
  }

  h3 {
    margin-top: 2rem;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  .wrapper {
    display: inline-flex;
    flex: 1;
    width: 100%;
    min-height: 9rem;
    padding: 2rem 0 2rem 1rem;
  }
</style>

<div class="preview bx--row" class:light>
  <div class="grid">
    <div class="grid--row">
      {#each Array.from({ length: 8 }, (_, i) => i) as item, i (item)}
        <div class="grid--col bx--col" class:light>
          <div class="grid--col--outer">
            <div class="grid--col--inner" class:light />
          </div>
        </div>
      {/each}
    </div>
  </div>
  <div class="bx--col bx--no-gutter--left">
    <div class="wrapper" style={`min-height: ${minHeight}`}>
      <slot />
    </div>
  </div>
</div>

<div class="bx--row">
  <div class="bx--col-lg-4">
    <h3>Props</h3>
    <slot name="props" />
  </div>
  <div class="bx--col">
    <h3>Code</h3>
    <CodeSnippet type="multi" on:click={() => copy(code)} {code} />
    <slot name="code" />
  </div>
</div>
