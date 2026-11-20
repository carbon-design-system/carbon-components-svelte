<script>
  import { Button, MarkdownEditor, Stack } from "carbon-components-svelte";

  let value = "";
  let submitted = "";
  let invalid = false;

  function handleReset() {
    invalid = false;
    submitted = "";
  }

  function handleSubmit(event) {
    event.preventDefault();
    invalid = value.trim() === "";
    submitted = invalid
      ? ""
      : String(new FormData(event.currentTarget).get("body"));
  }
</script>

<form on:submit={handleSubmit} on:reset={handleReset}>
  <Stack gap={5}>
    <MarkdownEditor
      labelText="Description"
      helperText="Describe the change"
      name="body"
      maxCount={400}
      {invalid}
      invalidText="A description is required"
      bind:value
    />
    <Stack gap={3} orientation="horizontal">
      <Button type="submit">Submit</Button>
      <Button type="reset" kind="secondary">Reset</Button>
    </Stack>
    {#if submitted}
      <pre>{submitted}</pre>
    {/if}
  </Stack>
</form>
