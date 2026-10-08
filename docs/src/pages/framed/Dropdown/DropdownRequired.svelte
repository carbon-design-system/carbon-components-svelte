<script>
  import { Button, Dropdown, Form, Stack } from "carbon-components-svelte";

  let submitted = false;
</script>

<Form
  on:submit={(e) => {
    e.preventDefault();
    submitted = true;
  }}
>
  <Stack gap={5}>
    <Dropdown
      required
      labelText="Contact"
      label="Select a contact method"
      items={[
        { id: "0", text: "Slack" },
        { id: "1", text: "Email" },
        { id: "2", text: "Fax" },
      ]}
      on:select={() => (submitted = false)}
    />
    <div>
      <Button type="submit">Submit</Button>
    </div>
    {#if submitted}
      <p>Submitted.</p>
    {/if}
  </Stack>
</Form>
