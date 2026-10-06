<script>
  import {
    Accordion,
    AccordionItem,
    Button,
    Checkbox,
    ClickableTile,
    CodeSnippet,
    ComboBox,
    ContentSwitcher,
    DatePicker,
    DatePickerInput,
    Dropdown,
    ExpandableTile,
    FileUploaderButton,
    FluidForm,
    Link,
    MultiSelect,
    NumberInput,
    OverflowMenu,
    OverflowMenuItem,
    PinCodeInput,
    RadioButton,
    RadioButtonGroup,
    RadioTile,
    Search,
    Select,
    SelectableTile,
    SelectItem,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    Slider,
    Switch,
    Tab,
    Tabs,
    TextArea,
    TextInput,
    TileGroup,
    TimePicker,
    Toggle,
  } from "carbon-components-svelte";

  const items = [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
  ];
</script>

<div style="display: grid; gap: 12px; width: 420px; padding: 12px">
  <Button>Button</Button>
  <Link href="#x">Link</Link>
  <Checkbox labelText="Checkbox" />
  <RadioButtonGroup legendText="Radio"
    ><RadioButton labelText="R1" value="1" />
    <RadioButton labelText="R2" value="2" /></RadioButtonGroup
  >
  <Toggle labelText="Toggle" />
  <TextInput labelText="Text" />
  <TextArea labelText="Area" />
  <NumberInput label="Number" />
  <Search />
  <Select labelText="Select"><SelectItem value="a" /></Select>
  <Dropdown titleText="Dropdown" {items} selectedId="a" />
  <ComboBox titleText="Combo" {items} />
  <MultiSelect titleText="Multi" {items} />
  <MultiSelect titleText="Multi filterable" filterable {items} />
  <DatePicker><DatePickerInput labelText="Date" /></DatePicker>
  <TimePicker labelText="Time" />
  <Slider labelText="Slider" />
  <FileUploaderButton labelText="Browse" />
  <ContentSwitcher><Switch text="One" /><Switch text="Two" /></ContentSwitcher>
  <Tabs><Tab label="Tab 1" /><Tab label="Tab 2" /></Tabs>
  <Accordion><AccordionItem title="Accordion">x</AccordionItem></Accordion>
  <CodeSnippet
    type="multi"
    code={"a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm\nn\no\np\nq\nr\ns\nt"}
  />
  <OverflowMenu><OverflowMenuItem text="Item" /></OverflowMenu>
  <ClickableTile href="#t">Clickable tile</ClickableTile>
  <SelectableTile>Selectable tile</SelectableTile>
  <TileGroup legendText="Tiles"
    ><RadioTile value="a">Radio tile</RadioTile></TileGroup
  >
  <ExpandableTile hasInteractiveContent tileCollapsedLabel="More"
    ><span slot="above">Expandable</span
    ><span slot="below">b</span></ExpandableTile
  >
  <PinCodeInput labelText="Pin" />
  <FluidForm>
    <TextInput labelText="Fluid text" />
    <Select labelText="Fluid select"><SelectItem value="a" /></Select>
    <Dropdown titleText="Fluid dropdown" {items} selectedId="a" />
    <ComboBox titleText="Fluid combo" {items} />
    <DatePicker datePickerType="single"
      ><DatePickerInput labelText="Fluid date" /></DatePicker
    >
    <TimePicker labelText="Fluid time" />
    <PinCodeInput labelText="Fluid pin" />
  </FluidForm>
  <SideNav fixed expanded isOpen>
    <SideNavItems>
      <SideNavLink text="Side link" href="#s" />
      <SideNavMenu text="Side menu"
        ><SideNavMenuItem text="Side item" href="#m" /></SideNavMenu
      >
    </SideNavItems>
  </SideNav>
</div>
