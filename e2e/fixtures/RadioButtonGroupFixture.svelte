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

<div data-testid="box-12rem" style="width: 12rem">
  <RadioButtonGroup
    data-testid="radio-group-narrow"
    legendText="Text"
    selected="compact"
  >
    <RadioButton value="compact" labelText="Compact" />
    <RadioButton value="comfortable" labelText="Comfortable" />
  </RadioButtonGroup>
</div>

{#each [240, 320] as width}
  <div data-testid="box-{width}" style="width: {width}px">
    <RadioButtonGroup
      data-testid="radio-group-{width}"
      legendText="Density"
      selected="compact"
    >
      <RadioButton value="compact" labelText="Compact" />
      <RadioButton value="comfortable" labelText="Comfortable" />
      <RadioButton value="spacious" labelText="Spacious" />
      <RadioButton value="extra" labelText="Extra spacious" />
    </RadioButtonGroup>
  </div>
{/each}

<div data-testid="box-long-word" style="width: 12rem">
  <RadioButtonGroup
    data-testid="radio-group-long-word"
    legendText="Law"
    selected="long"
  >
    <RadioButton
      value="long"
      labelText="Datenschutzgrundverordnungskonformitätsprüfung"
    />
  </RadioButtonGroup>
</div>

<div style="width: 12rem">
  <RadioButtonGroup
    data-testid="radio-group-invalid-wrapped"
    legendText="Text"
    selected="compact"
    invalid
    invalidText="Choose a density"
  >
    <RadioButton value="compact" labelText="Compact" />
    <RadioButton value="comfortable" labelText="Comfortable" />
  </RadioButtonGroup>
</div>

<div style="width: 30rem">
  <RadioButtonGroup
    data-testid="radio-group-invalid-row"
    legendText="Text"
    selected="compact"
    invalid
    invalidText="Choose a density"
  >
    <RadioButton value="compact" labelText="Compact" />
    <RadioButton value="comfortable" labelText="Comfortable" />
  </RadioButtonGroup>
  <RadioButtonGroup
    data-testid="radio-group-warn-row"
    legendText="Text"
    selected="compact"
    warn
    warnText="Compact is deprecated"
  >
    <RadioButton value="compact" labelText="Compact" />
    <RadioButton value="comfortable" labelText="Comfortable" />
  </RadioButtonGroup>
</div>
