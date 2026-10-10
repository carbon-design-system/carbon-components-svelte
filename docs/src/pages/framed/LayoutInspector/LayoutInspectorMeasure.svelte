<script>
  import {
    Column,
    Grid,
    LayoutInspector,
    RadioButton,
    RadioButtonGroup,
    Row,
    Text,
  } from "carbon-components-svelte";

  let measureKey = "Alt";
</script>

<Grid padding>
  <Row>
    <Column>
      <RadioButtonGroup legendText="measureKey" bind:selected={measureKey}>
        <RadioButton labelText="Alt (⌥ Option)" value="Alt" />
        <RadioButton labelText="Shift" value="Shift" />
      </RadioButtonGroup>
      <Text style="margin-top: 1rem;">
        Click inside this frame first so it receives key presses. Hover box A,
        hold the key, then move to box B, C, or the frame around them. Release
        the key to go back to the box model.
      </Text>
    </Column>
  </Row>
  <Row>
    <Column>
      <div class="frame">
        <div class="box">A</div>
        <div class="box" style="margin-left: 2rem;">B</div>
        <div class="box" style="margin-left: 20px;">C</div>
      </div>
      <div class="box" style="margin-top: 1.5rem;">D</div>
    </Column>
  </Row>
</Grid>

<LayoutInspector open {measureKey} />

<style>
  .frame {
    display: flex;
    margin-top: 1.5rem;
    padding: 1rem;
    outline: 1px dashed var(--cds-border-strong, #8d8d8d);
  }

  .box {
    display: grid;
    width: 6rem;
    height: 4rem;
    place-items: center;
    background: var(--cds-layer, #f4f4f4);
    outline: 1px solid var(--cds-border-subtle, #e0e0e0);
  }
</style>
