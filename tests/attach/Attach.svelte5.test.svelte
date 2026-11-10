<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import type { Action } from "svelte/action";
  import type { Attachment } from "svelte/attachments";
  import { fromAction } from "svelte/attachments";

  export let attach: Attachment;
  export let action: Action<HTMLElement, void>;
  export let show = true;
</script>

{#if show}
  <Form data-testid="form" {@attach fromAction(action)}>
    <TextInput labelText="Name" {@attach attach} />
    <Button {@attach attach}>Save</Button>
  </Form>
{/if}
