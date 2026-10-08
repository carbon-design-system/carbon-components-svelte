<script>
  import {
    Button,
    ButtonSet,
    Form,
    Stack,
    TagInput,
  } from "carbon-components-svelte";

  let submitted = [];

  function handleSubmit(event) {
    event.preventDefault();
    submitted = new FormData(event.target).getAll("topics");
  }
</script>

<Stack gap={5}>
  <Form on:submit={handleSubmit}>
    <Stack gap={5}>
      <TagInput
        name="topics"
        value={["Svelte"]}
        labelText="Topics"
        placeholder="Add a topic"
      />
      <ButtonSet>
        <Button kind="secondary" type="reset">Reset</Button>
        <Button type="submit">Save</Button>
      </ButtonSet>
    </Stack>
  </Form>
  <p>Submitted topics: {JSON.stringify(submitted)}</p>
</Stack>
