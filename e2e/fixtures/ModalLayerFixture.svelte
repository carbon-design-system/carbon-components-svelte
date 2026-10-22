<script>
  import {
    Accordion,
    AccordionItem,
    ComposedModal,
    DataTable,
    DatePicker,
    DatePickerInput,
    Dropdown,
    Layer,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    MultiSelect,
    NumberInput,
    Pagination,
    Search,
    Select,
    SelectItem,
    TextArea,
    TextInput,
    Tile,
  } from "carbon-components-svelte";

  const headers = [{ key: "name", value: "Name" }];
  const rows = [
    { id: "a", name: "Load balancer" },
    { id: "b", name: "Database" },
  ];
  const regions = [
    { id: "us-east-1", text: "us-east-1" },
    { id: "eu-west-1", text: "eu-west-1" },
  ];
</script>

<Modal open passiveModal modalHeading="Workspace settings" data-testid="modal">
  <TextInput labelText="Workspace name" />
  <Tile>Usage this month</Tile>
  <Accordion>
    <AccordionItem title="Billing">Billed monthly</AccordionItem>
  </Accordion>
  <DataTable size="compact" {headers} {rows} />
  <NumberInput label="Seats" value={5} />
  <Dropdown titleText="Region" items={regions} selectedId="us-east-1" />
  <MultiSelect titleText="Replicas" label="Choose regions" items={regions} />
  <Select labelText="Plan">
    <SelectItem value="team" text="Team" />
  </Select>
  <Search labelText="Search members" />
  <TextArea labelText="Notes" />
  <DatePicker datePickerType="single">
    <DatePickerInput labelText="Renewal date" readonly />
  </DatePicker>
  <Pagination totalItems={40} />
  <Layer data-testid="modal-nested">
    <TextInput labelText="Nested on a Layer" />
  </Layer>
</Modal>

<ComposedModal open data-testid="composed-modal">
  <ModalHeader title="Workspace settings" />
  <ModalBody>
    <TextInput labelText="Workspace name" />
    <Tile>Usage this month</Tile>
    <DataTable size="compact" {headers} {rows} />
    <Layer data-testid="composed-modal-nested">
      <TextInput labelText="Nested on a Layer" />
    </Layer>
  </ModalBody>
  <ModalFooter primaryButtonText="Save" />
</ComposedModal>
