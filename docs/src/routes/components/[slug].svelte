<script context="module">
  export async function preload({ params }) {
    const res = await this.fetch(`components/${params.slug}.json`);
    const data = await res.json();

    if (res.status === 200) {
      return { data };
    } else {
      this.error(res.status, data.message);
    }
  }
</script>

<script>
  export let data = {};

  import { onMount, getContext } from "svelte";
  import {
    Grid,
    Row,
    Column,
    CodeSnippet,
    FormGroup,
    RadioButtonGroup,
    RadioButton,
  } from "carbon-components-svelte";
  import copy from "clipboard-copy";

  const ctx = getContext("navigation");

  let component = undefined;
  let defaultProps = {};

  $: props = data.props || {};
  $: {
    if (data.props) {
      Object.keys(data.props).forEach((prop) => {
        if (!(prop in defaultProps)) {
          defaultProps = {
            ...defaultProps,
            [prop]: data.props[prop].default,
          };
        }
      });
    }
  }

  onMount(async () => {
    ctx.setTail(data);

    try {
      component = await import(`../examples/${data.title}.svelte`);
    } catch (e) {
      console.error(e);
    }

    return () => {
      ctx.setTail(undefined);
    };
  });
</script>

<style>
  .preview {
    width: 100%;
    min-height: 8rem;
    margin-bottom: 2.5rem;
    padding: 1rem;
    white-space: nowrap;
    overflow-x: auto;
    background-color: var(--cds-ui-01);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
  }

  :global(.preview h4) {
    margin-bottom: 0.75rem;
    font-size: 1rem;
    color: var(--cds-text-02);
  }

  :global(.preview > div) {
    margin-bottom: 2.5rem;
  }
</style>

<svelte:head>
  <title>{data.title}</title>
</svelte:head>

<Row>
  <Column>
    <h1>{data.title}</h1>
  </Column>
</Row>

<Row noGutter>
  <div class="preview">
    {#if component}
      <svelte:component this="{component.default}" {...defaultProps} />
    {/if}
  </div>
</Row>

<Row>
  <Column md="{3}" lg="{4}">
    {#each Object.keys(props) as key}
      {#if Array.isArray(props[key].values)}
        <FormGroup legendText="{key}">
          <RadioButtonGroup
            selected="{props[key].default}"
            on:change="{({ detail }) => {
              defaultProps = { ...defaultProps, [key]: detail };
            }}"
          >
            {#each props[key].values as value}
              <RadioButton value="{value}" id="{value}" labelText="{value}" />
            {/each}
          </RadioButtonGroup>
        </FormGroup>
      {/if}
    {/each}
  </Column>
  <Column md="{5}">
    <CodeSnippet
      type="multi"
      code="{data.source}"
      on:click="{() => {
        copy(data.source);
      }}"
    />
  </Column>
</Row>
