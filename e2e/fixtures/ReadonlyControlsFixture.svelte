<script>
  import {
    Checkbox,
    RadioButton,
    RadioButtonGroup,
    Toggle,
  } from "carbon-components-svelte";
</script>

<div
  style:display="flex"
  style:flex-wrap="wrap"
  style:gap="32px"
  style:width="fit-content"
  style:padding="16px"
>
  <div data-testid="readonly-checkboxes">
    <Checkbox readonly labelText="Read-only unchecked" />
    <Checkbox readonly checked labelText="Read-only checked" />
    <Checkbox disabled labelText="Disabled unchecked" />
  </div>

  <RadioButtonGroup
    data-testid="readonly-radios"
    legendText="Read-only radios"
    readonly
    selected="one"
  >
    <RadioButton value="one" labelText="Selected" />
    <RadioButton value="two" labelText="Not selected" />
  </RadioButtonGroup>

  <div data-testid="readonly-toggles">
    <Toggle readonly toggled={false} labelText="Read-only off" />
    <Toggle readonly toggled labelText="Read-only on" />
    <Toggle disabled labelText="Disabled off" />
  </div>
</div>
