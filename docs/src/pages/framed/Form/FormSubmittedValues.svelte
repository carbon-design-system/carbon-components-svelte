<script>
  import {
    Button,
    Checkbox,
    CodeSnippet,
    Dropdown,
    Form,
    FormGroup,
    MultiSelect,
    NumberInput,
    RadioButton,
    RadioButtonGroup,
    Select,
    SelectItem,
    Stack,
    TextInput,
    Toggle,
  } from "carbon-components-svelte";

  const teams = [
    { id: "design", text: "Design" },
    { id: "eng", text: "Engineering" },
    { id: "ops", text: "Operations" },
  ];

  /** @type {null | string} */
  let submitted = null;
</script>

<Stack gap={7}>
  <Form
    on:submit={(e) => {
      e.preventDefault();
      const entries = [...new FormData(e.currentTarget)];
      submitted = entries
        .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
        .join("\n");
    }}
  >
    <FormGroup legendText="Workspace">
      <Stack gap={5}>
        <TextInput name="workspace" labelText="Name" value="Acme" />
        <NumberInput name="seats" labelText="Seats" value={5} min={1} />
        <TextInput
          name="account"
          labelText="Account (read-only, submitted)"
          value="acct-042"
          readonly
        />
        <TextInput
          name="internal"
          labelText="Internal id (disabled, not submitted)"
          value="int-7"
          disabled
        />
      </Stack>
    </FormGroup>
    <FormGroup legendText="Plan">
      <Stack gap={5}>
        <RadioButtonGroup name="plan" selected="team">
          <RadioButton value="starter" labelText="Starter" />
          <RadioButton value="team" labelText="Team" />
        </RadioButtonGroup>
        <Select name="region" labelText="Region" selected="eu-de">
          <SelectItem value="us-east" text="US East" />
          <SelectItem value="eu-de" text="EU Germany" />
        </Select>
        <Dropdown
          name="channel"
          labelText="Alert channel"
          selectedId="email"
          items={[
          { id: "email", text: "Email" },
          { id: "slack", text: "Slack" },
        ]}
        />
        <MultiSelect
          name="teams"
          labelText="Teams"
          label="Select teams"
          selectedIds={["design", "eng"]}
          items={teams}
        />
      </Stack>
    </FormGroup>
    <FormGroup legendText="Consent">
      <Stack gap={5}>
        <div>
          <Checkbox name="terms" labelText="Accept the terms" checked />
          <Checkbox name="marketing" labelText="Send product updates" />
        </div>
        <Toggle
          name="digest"
          value="weekly"
          labelText="Weekly digest"
          toggled
        />
      </Stack>
    </FormGroup>
    <Button type="submit">Show submitted values</Button>
  </Form>

  {#if submitted}
    <CodeSnippet type="multi" code={submitted} />
  {/if}
</Stack>
