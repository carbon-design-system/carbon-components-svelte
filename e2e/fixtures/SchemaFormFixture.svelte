<script>
  import { SchemaForm } from "carbon-components-svelte";
  import { fields } from "../../docs/src/pages/framed/SchemaForm/CloudInstance.svelte";

  const params = new URLSearchParams(location.search);
  const fluid = params.get("fluid") === "true";

  let submitted = "";
  let form;
  $: if (form && typeof window !== "undefined") window.__sfForm = form;
</script>

<div data-testid="schema-form">
  <SchemaForm
    {fields}
    {fluid}
    initialValues={{ basics: { owner: "ada@example.com" } }}
    optionalMark
    bind:form
    on:submit={(event) => (submitted = JSON.stringify(event.detail))}
  />
  <pre data-testid="submitted">{submitted}</pre>
</div>
