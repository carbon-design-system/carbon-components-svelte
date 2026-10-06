<script>
  import { Button, Form, formReset } from "carbon-components-svelte";

  let preview = "";
</script>

<Form>
  <label class="bx--label" for="project-slug">Project slug</label>
  <input
    id="project-slug"
    class="bx--text-input"
    placeholder="payments-api"
    on:input={(e) =>
      (preview = `https://acme-corp.com/${e.currentTarget.value}`)}
    use:formReset={() => (preview = "")}
  >
  <p>Preview: {preview || "Enter a slug"}</p>
  <Button type="reset" kind="secondary">Reset</Button>
</Form>
