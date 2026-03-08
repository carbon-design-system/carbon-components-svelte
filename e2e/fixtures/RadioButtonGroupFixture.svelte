<script>
  import { RadioButton, RadioButtonGroup } from "carbon-components-svelte";

  let selected = "one";
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
