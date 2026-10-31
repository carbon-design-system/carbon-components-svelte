<script>
  import {
    Button,
    ButtonSet,
    Form,
    RichTextEditor,
    Stack,
  } from "carbon-components-svelte";

  let submitted = "";

  function handleSubmit(event) {
    event.preventDefault();
    submitted = String(new FormData(event.target).get("body") ?? "");
  }
</script>

<Stack gap={5}>
  <Form on:submit={handleSubmit}>
    <Stack gap={5}>
      <RichTextEditor
        name="body"
        labelText="Body"
        required
        requiredText="Write a message before you send"
        value="<p>Draft</p>"
      />
      <ButtonSet>
        <Button kind="secondary" type="reset">Reset</Button>
        <Button type="submit">Send</Button>
      </ButtonSet>
    </Stack>
  </Form>
  <p>Submitted: {submitted}</p>
</Stack>
