<script>
  import {
    NumberInput,
    PasswordInput,
    Select,
    SelectItem,
    TextArea,
    TextInput,
  } from "carbon-components-svelte";
</script>

<div data-testid="text-input">
  <TextInput readonly labelText="Workspace name" value="acme-production" />
</div>

<div data-testid="password-input">
  <PasswordInput readonly labelText="Password" value="TempPass_8f3K21" />
</div>

<div data-testid="number-input">
  <NumberInput readonly labelText="Clusters" value={3} />
</div>

<div data-testid="number-input-no-steppers">
  <NumberInput readonly hideSteppers labelText="Clusters" value={3} />
</div>

<div data-testid="text-area">
  <TextArea readonly labelText="Notes" value="Rotated keys on deploy." />
</div>

<div data-testid="select">
  <Select readonly labelText="Region" selected="us-east">
    <SelectItem value="us-east" text="US East" />
  </Select>
</div>

<div data-testid="fluid-text-input">
  <TextInput
    fluid
    readonly
    labelText="Workspace name"
    value="acme-production"
  />
</div>

<div data-testid="fluid-number-input">
  <NumberInput fluid readonly labelText="Clusters" value={3} />
</div>

<div data-testid="text-input-editable">
  <TextInput labelText="Workspace name" value="acme-production" />
</div>

<div data-testid="number-input-editable">
  <NumberInput labelText="Clusters" value={3} />
</div>
