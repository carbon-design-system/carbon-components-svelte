<script>
  import {
    Button,
    ButtonSet,
    Form,
    KeyValueEditor,
    rowsFromFormData,
    Stack,
  } from "carbon-components-svelte";

  let posted = [];

  function handleSubmit(event) {
    event.preventDefault();
    posted = rowsFromFormData(new FormData(event.target), "env");
  }
</script>

<Stack gap={5}>
  <Form on:submit={handleSubmit}>
    <Stack gap={5}>
      <KeyValueEditor
        name="env"
        format="env"
        columns={["secret", "scope"]}
        scopes={[
          { id: "", text: "All environments" },
          { id: "production", text: "Production" },
          { id: "preview", text: "Preview" },
        ]}
        rows={[
          {
            key: "API_URL",
            value: "https://api.example.com",
            scope: "production",
          },
          {
            key: "API_URL",
            value: "https://staging.example.com",
            scope: "preview",
          },
        ]}
        labelText="Environment variables"
        helperText="The same key can appear once for each environment."
      />
      <ButtonSet>
        <Button kind="secondary" type="reset">Reset</Button>
        <Button type="submit">Save</Button>
      </ButtonSet>
    </Stack>
  </Form>
  <pre>{JSON.stringify(posted, null, 2)}</pre>
</Stack>
