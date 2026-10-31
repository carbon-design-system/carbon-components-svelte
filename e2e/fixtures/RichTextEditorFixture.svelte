<script>
  import { RichTextEditor } from "carbon-components-svelte";

  let value = "<p>Hello <strong>world</strong></p>";
  let changes = 0;
  let inputs = 0;
  let submitted = "";
  let formValue = "";

  function handleSubmit(event) {
    event.preventDefault();
    submitted = new FormData(event.currentTarget).get("body") ?? "";
  }
</script>

<RichTextEditor
  labelText="Notes"
  helperText="Formatting is kept"
  placeholder="Write something"
  bind:value
  on:input={() => inputs++}
  on:change={() => changes++}
/>
<div data-testid="value">{value}</div>
<div data-testid="inputs">{inputs}</div>
<div data-testid="changes">{changes}</div>
<button
  type="button"
  data-testid="set-external"
  on:click={() => (value = "<h2>External</h2><p>set from outside</p>")}
>
  Set value
</button>

<RichTextEditor labelText="Empty" placeholder="Nothing here yet" />
<RichTextEditor labelText="Disabled" disabled value="<p>Disabled content</p>" />
<RichTextEditor
  labelText="Read-only"
  readonly
  value="<p>Read-only content</p>"
/>
<RichTextEditor
  labelText="Invalid"
  invalid
  invalidText="Add a summary"
  value="<p>Draft</p>"
/>
<RichTextEditor
  labelText="Warning"
  warn
  warnText="This will be public"
  value="<p>Heads up</p>"
/>
<RichTextEditor
  labelText="Limited"
  maxCount={20}
  value="<p>Within the limit</p>"
/>

<form on:submit={handleSubmit}>
  <RichTextEditor
    labelText="Body"
    name="body"
    required
    requiredText="Body is required"
    bind:value={formValue}
  />
  <button type="submit">Send</button>
  <button type="reset">Reset</button>
</form>
<div data-testid="submitted">{submitted}</div>
