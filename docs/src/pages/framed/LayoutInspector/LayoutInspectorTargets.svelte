<script>
  import {
    Button,
    Checkbox,
    Column,
    Grid,
    LayoutInspector,
    Link,
    RadioButton,
    RadioButtonGroup,
    Row,
    Stack,
    Text,
  } from "carbon-components-svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  let targetSize = 24;
</script>

<Grid padding>
  <Row>
    <Column>
      <Stack gap={6}>
        <RadioButtonGroup legendText="targetSize" bind:selected={targetSize}>
          <RadioButton labelText="24 (WCAG 2.2 AA)" value={24} />
          <RadioButton labelText="44 (WCAG 2.2 AAA)" value={44} />
        </RadioButtonGroup>
        <div class="row">
          <button class="icon" type="button" aria-label="Edit"><Edit /></button>
          <button class="icon" type="button" aria-label="Delete">
            <TrashCan />
          </button>
          <Button size="small">Small button</Button>
          <Button>Default button</Button>
        </div>
        <Checkbox labelText="The label counts toward the checkbox's target" />
        <Text>
          Inline links in running text, <Link href="/">like this one</Link>, are
          exempt, so they are not flagged.
        </Text>
        <Link href="/" style="display: inline-block;">A standalone link</Link>
      </Stack>
    </Column>
  </Row>
</Grid>

<LayoutInspector open spacing={false} targets {targetSize} />

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .icon {
    display: grid;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    place-items: center;
  }
</style>
