<script>
  import {
    TextArea,
    TextInput,
    ToggleSmall,
    CodeSnippet,
    FormGroup,
    RadioButtonGroup,
    RadioButton
  } from 'carbon-components-svelte';
  import { ComponentPreview } from '../../Component';

  $: props = {
    code: `
      This is a <CodeSnippet />
    `.trim(),
    light: false,
    type: 'single',
    skeleton: false,
    feedback: 'Copied!'
  };

  $: code = `
<script>
  import { CodeSnippet } from 'carbon-components-svelte';

  $: code = \`${props.code}\`;
< /script>

<CodeSnippet type="${props.type}"${props.light ? ' light' : ''} {code}${
    props.skeleton ? ' skeleton' : ''
  } feedback="${props.feedback}" />
  `;

  $: if (props.type === 'inline') {
    props.skeleton = false;
  }
</script>

<ComponentPreview light={props.light} {code}>
  <div>
    <CodeSnippet {...props} />
  </div>
  <div slot="props">
    <FormGroup legendText="Type">
      <RadioButtonGroup legend="Type" bind:selected={props.type}>
        <RadioButton value="inline" id="inline" labelText="inline" />
        <RadioButton value="single" id="single" labelText="single" />
        <RadioButton value="multi" id="multi" labelText="multi" />
      </RadioButtonGroup>
    </FormGroup>
    <FormGroup legendText="Light variant">
      <ToggleSmall id="toggle-light" bind:toggled={props.light} />
    </FormGroup>
    <FormGroup legendText="Code">
      {#if props.type === 'multi'}
        <TextArea bind:value={props.code} />
      {:else}
        <TextInput bind:value={props.code} />
      {/if}
    </FormGroup>
    <FormGroup legendText="Skeleton">
      <ToggleSmall
        id="toggle-skeleton"
        disabled={props.type === 'inline'}
        bind:toggled={props.skeleton} />
    </FormGroup>
    <FormGroup legendText="Feedback text">
      <TextInput placeholder="Enter text" bind:value={props.feedback} />
    </FormGroup>
  </div>
</ComponentPreview>
