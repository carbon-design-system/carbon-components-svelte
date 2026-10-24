<script>
  import {
    Box,
    Column,
    Grid,
    RadioButton,
    RadioButtonGroup,
    Row,
    Text,
  } from "carbon-components-svelte";
  import { LayoutInspector } from "carbon-components-svelte/devtools";

  let measureKey = "Alt";
</script>

<Grid padding>
  <Row>
    <Column>
      <Box marginBottom={5}>
        <RadioButtonGroup legendText="measureKey" bind:selected={measureKey}>
          <RadioButton labelText="Alt (⌥ Option)" value="Alt" />
          <RadioButton labelText="Shift" value="Shift" />
        </RadioButtonGroup>
      </Box>
      <Text>
        Click inside this frame first so it receives key presses. Hover box A,
        hold the key, then move to box B, C, or the frame around them. Release
        the key to go back to the box model.
      </Text>
    </Column>
  </Row>
  <Row>
    <Column>
      <!-- The box margins are the distances you measure. -->
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
    outline: 1px dashed var(--cds-border-strong);
  }

  .box {
    display: grid;
    width: 6rem;
    height: 4rem;
    place-items: center;
    background: var(--cds-layer);
    outline: 1px solid var(--cds-border-subtle);
  }
</style>
