<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import Table from "carbon-components-svelte/DataTable/Table.svelte";
  import TableHead from "carbon-components-svelte/DataTable/TableHead.svelte";
  import TableHeader from "carbon-components-svelte/DataTable/TableHeader.svelte";
  import TableRow from "carbon-components-svelte/DataTable/TableRow.svelte";
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import ClickableTile from "carbon-components-svelte/Tile/ClickableTile.svelte";
  import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import Tile from "carbon-components-svelte/Tile/Tile.svelte";
  import AILabelOrIcon from "./AILabelOrIcon.test.svelte";

  export let ai = true;

  const items = [{ id: "us-east-1", text: "US East" }];
</script>

<div data-testid="tile">
  <Tile>Forecast<AILabelOrIcon slot="decorator" {ai} /></Tile>
</div>
<div data-testid="clickable-tile">
  <ClickableTile href="#"
    >Open<AILabelOrIcon slot="decorator" {ai} /></ClickableTile
  >
</div>
<div data-testid="selectable-tile">
  <SelectableTile>Plan<AILabelOrIcon slot="decorator" {ai} /></SelectableTile>
</div>
<div data-testid="radio-tile">
  <RadioTile value="a">Plan<AILabelOrIcon slot="decorator" {ai} /></RadioTile>
</div>
<div data-testid="expandable-tile">
  <ExpandableTile>
    <div slot="above">Details</div>
    <div slot="below">More</div>
    <AILabelOrIcon slot="decorator" {ai} />
  </ExpandableTile>
</div>
<div data-testid="text-input">
  <TextInput labelText="Summary"
    ><AILabelOrIcon slot="decorator" {ai} /></TextInput
  >
</div>
<div data-testid="text-area">
  <TextArea labelText="Notes"><AILabelOrIcon slot="decorator" {ai} /></TextArea>
</div>
<div data-testid="number-input">
  <NumberInput labelText="Replicas" value={1}>
    <AILabelOrIcon slot="decorator" {ai} />
  </NumberInput>
</div>
<div data-testid="select">
  <Select labelText="Plan">
    <SelectItem value="team" text="Team" />
    <AILabelOrIcon slot="decorator" {ai} />
  </Select>
</div>
<div data-testid="inline-select">
  <Select inline labelText="Plan">
    <SelectItem value="team" text="Team" />
    <AILabelOrIcon slot="decorator" {ai} />
  </Select>
</div>
<div data-testid="date-picker">
  <DatePicker>
    <DatePickerInput labelText="Start"
      ><AILabelOrIcon slot="decorator" {ai} /></DatePickerInput
    >
  </DatePicker>
</div>
<div data-testid="dropdown">
  <Dropdown labelText="Region" {items}
    ><AILabelOrIcon slot="decorator" {ai} /></Dropdown
  >
</div>
<div data-testid="combo-box">
  <ComboBox labelText="Region search" {items}>
    <AILabelOrIcon slot="decorator" {ai} />
  </ComboBox>
</div>
<div data-testid="multi-select">
  <MultiSelect labelText="Regions" {items}
    ><AILabelOrIcon slot="decorator" {ai} /></MultiSelect
  >
</div>
<div data-testid="table-header">
  <Table>
    <TableHead>
      <TableRow>
        <TableHeader
          >Forecast<AILabelOrIcon slot="decorator" {ai} /></TableHeader
        >
      </TableRow>
    </TableHead>
  </Table>
</div>
<div data-testid="sortable-table-header">
  <Table sortable>
    <TableHead>
      <TableRow>
        <TableHeader sortable>
          Forecast<AILabelOrIcon slot="decorator" {ai} />
        </TableHeader>
      </TableRow>
    </TableHead>
  </Table>
</div>
<div data-testid="modal">
  <Modal open modalHeading="Forecast" passiveModal>
    <AILabelOrIcon slot="decorator" {ai} />
    Body
  </Modal>
</div>
<div data-testid="composed-modal">
  <ComposedModal open>
    <ModalBody>Body</ModalBody>
    <AILabelOrIcon slot="decorator" {ai} />
  </ComposedModal>
</div>
<div data-testid="plain">
  <Tile>Plain</Tile>
  <TextInput labelText="Plain" />
</div>
