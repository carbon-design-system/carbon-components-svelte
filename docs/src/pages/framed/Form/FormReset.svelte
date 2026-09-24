<script>
  import {
    Button,
    ButtonSet,
    Checkbox,
    Form,
    Select,
    SelectItem,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  let name = "Acme";
  let notify = true;
  let region = "eu-de";
  let resets = 0;
</script>

<Stack gap={5}>
  <Form on:reset={() => (resets += 1)} on:submit={(e) => e.preventDefault()}>
    <Stack gap={5}>
      <TextInput bind:value={name} name="name" labelText="Workspace name" />
      <Select bind:selected={region} name="region" labelText="Region">
        <SelectItem value="us-east" text="US East" />
        <SelectItem value="eu-de" text="EU Germany" />
      </Select>
      <Checkbox bind:checked={notify} name="notify" labelText="Email me" />
      <ButtonSet>
        <Button kind="secondary" type="reset">Reset</Button>
        <Button type="submit">Save</Button>
      </ButtonSet>
    </Stack>
  </Form>

  <p>
    Bound values: {JSON.stringify({ name, region, notify })} · resets: {resets}
  </p>
</Stack>
