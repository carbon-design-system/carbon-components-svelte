<script>
  import {
    Box,
    Button,
    Checkbox,
    Column,
    Grid,
    Link,
    RadioButton,
    RadioButtonGroup,
    Row,
    Stack,
    Text,
    Toggle,
  } from "carbon-components-svelte";
  import { LayoutInspector } from "carbon-components-svelte/devtools";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  let targetSize = 24;
  let checkCarbon = false;
</script>

<Grid padding>
  <Row>
    <Column>
      <Stack gap={6}>
        <RadioButtonGroup legendText="targetSize" bind:selected={targetSize}>
          <RadioButton labelText="24 (WCAG 2.2 AA)" value={24} />
          <RadioButton labelText="44 (WCAG 2.2 AAA)" value={44} />
        </RadioButtonGroup>
        <Toggle
          labelText="Check Carbon components too"
          size="sm"
          bind:toggled={checkCarbon}
        />
        <Text>
          Edit and Delete sit 4px apart, so their circles overlap and both fail.
          Copy is just as small, but it has room around it, so it passes at 24.
        </Text>
        <Box display="flex" align="center" gap={2}>
          <button class="icon" type="button" aria-label="Edit"><Edit /></button>
          <button class="icon" type="button" aria-label="Delete">
            <TrashCan />
          </button>
          <Box display="flex" marginLeft={7}>
            <button class="icon" type="button" aria-label="Copy">
              <Copy />
            </button>
          </Box>
        </Box>
        <Box display="flex" align="center" gap={5}>
          <Button size="small">Small button</Button>
          <Button>Default button</Button>
        </Box>
        <Checkbox labelText="The label counts toward the checkbox's target" />
        <Text>
          Inline links in running text, <Link href="/">like this one</Link>, are
          exempt, so they are not flagged.
        </Text>
        <Link href="/">A standalone link</Link>
      </Stack>
    </Column>
  </Row>
</Grid>

<LayoutInspector open spacing={false} checkTargets {targetSize} {checkCarbon} />

<style>
  .icon {
    display: grid;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    place-items: center;
  }
</style>
