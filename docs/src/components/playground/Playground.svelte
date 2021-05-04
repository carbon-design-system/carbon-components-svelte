<script>
  import { Form } from "carbon-components-svelte";
  import Checkbox from "./Checkbox.svelte";
  import TextInput from "./TextInput.svelte";

  export let component;
  export let props;

  const components = { Checkbox, TextInput };
  const usedProps = {};
</script>

<div class="playground">
  <div class="element">
    <div class="element-wrapper">
      <svelte:component this="{component}" {...usedProps} />
    </div>
  </div>

  <div class="options">
    <h4 class="options-heading">Options</h4>
    <div class="options-content">
      <Form>
        {#each Object.entries(props) as [name, prop]}
          <svelte:component
            this="{components[prop.component]}"
            bind:value="{usedProps[name]}"
            {...prop.props}
          />
        {/each}
      </Form>
    </div>
  </div>
</div>

<style>
  .playground {
    border: 1px solid var(--cds-ui-03);
    display: flex;
    flex-direction: row;
    margin: 0 -1rem;
    max-width: 56rem;
  }

  .element {
    border-right: 1px solid var(--cds-ui-03);
    flex-basis: 60%;
    display: flex;
    align-items: center;
    padding: 1rem;
  }

  .options {
    flex-basis: 40%;
  }

  .options-heading {
    border-bottom: 1px solid var(--cds-ui-03);
    padding: 0.5rem 1rem;
  }

  .options-content {
    padding: 1rem;
  }
</style>
