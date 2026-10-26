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
      <!-- The margins between the boxes are the distances you measure. -->
      <div class="frame">
        <div class="box">A</div>
        <Box marginLeft={7}>
          <div class="box">B</div>
        </Box>
        <div class="box off-scale">C</div>
      </div>
      <Box marginTop={6}>
        <div class="box">D</div>
      </Box>
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

  /* Off the spacing scale on purpose. */
  .off-scale {
    margin-left: 20px;
  }
</style>
