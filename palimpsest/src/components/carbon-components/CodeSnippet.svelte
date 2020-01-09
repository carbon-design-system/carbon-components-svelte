<script>
  export let selected = 0;

  import copy from 'clipboard-copy';
  import {
    ToggleSmall,
    CodeSnippet,
    FormGroup,
    RadioButtonGroup,
    RadioButton
  } from 'carbon-components-svelte';

  $: code = `
    <CodeSnippet />
  `.trim();

  $: props = {
    light: false,
    type: 'single'
  };
</script>

<style>
  .bx--row {
    background-color: var(--cds-ui-01);
  }

  .wrapper {
    background-color: var(--cds-ui-background);
    border-left: 1px solid var(--cds-ui-03);
    border-right: 1px solid var(--cds-ui-03);
    border-bottom: 1px solid var(--cds-ui-03);
    flex: 1;
    display: inline-flex;
    min-height: 11.5rem;
    padding: 2.5rem 0.9375rem;
  }
</style>

{#if selected === 0}
  <div class="bx--row">
    <div class="wrapper">
      <div>
        <CodeSnippet {...props} on:click={() => copy(code)} {code} />
      </div>
    </div>
  </div>

  <div class="bx--row">
    <div class="bx--col">
      <h4 style="padding: 1rem 0;">Props</h4>
      <FormGroup legendText="Light variant (light)">
        <ToggleSmall id="toggle-light" bind:toggled={props.light} />
      </FormGroup>
      <FormGroup legendText="Type (type)">
        <RadioButtonGroup orientation="vertical" legend="Group Legend" bind:selected={props.type}>
          <RadioButton value="inline" id="inline" labelText="inline" />
          <RadioButton value="single" id="single" labelText="single" />
          <RadioButton value="multi" id="multi" labelText="multi" />
        </RadioButtonGroup>
      </FormGroup>
    </div>
  </div>
{/if}
