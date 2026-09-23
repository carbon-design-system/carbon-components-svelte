<script>
  import { RadioButton, RadioButtonGroup } from "carbon-components-svelte";

  let selected = "one";
  let deselectSelected = "one";
</script>

<RadioButtonGroup
  data-testid="radio-group-choice"
  legendText="Choose one"
  bind:selected
>
  <RadioButton value="one" labelText="Option One" />
  <RadioButton value="two" labelText="Option Two" />
  <RadioButton value="three" labelText="Option Three" />
</RadioButtonGroup>

<p data-testid="selected-value">Selected: {selected}</p>

<RadioButtonGroup
  data-testid="radio-group-deselect"
  legendText="Deselectable option"
  allowDeselect
  bind:selected={deselectSelected}
>
  <RadioButton value="one" labelText="Option One" />
  <RadioButton value="two" labelText="Option Two" />
  <RadioButton value="three" labelText="Option Three" />
</RadioButtonGroup>

<p data-testid="deselect-selected-value">Selected: {deselectSelected}</p>

<RadioButtonGroup
  data-testid="radio-group-readonly"
  legendText="Readonly option"
  readonly
  selected="one"
>
  <RadioButton value="one" labelText="Option One" />
  <RadioButton value="two" labelText="Option Two" />
  <RadioButton value="three" labelText="Option Three" />
</RadioButtonGroup>
