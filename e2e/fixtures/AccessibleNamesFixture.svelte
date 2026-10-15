<script>
  import {
    Accordion,
    AccordionItem,
    Breadcrumb,
    BreadcrumbItem,
    Carousel,
    CarouselItem,
    Checkbox,
    CodeSnippet,
    ComboBox,
    ComboButton,
    CopyInput,
    DataTable,
    DatePicker,
    DatePickerInput,
    Disclosure,
    Dropdown,
    ExpandableTile,
    FileUploader,
    FileUploaderButton,
    FileUploaderDropContainer,
    Meter,
    MultiSelect,
    NumberInput,
    OverflowMenu,
    OverflowMenuItem,
    PasswordInput,
    PinCodeInput,
    ProgressBar,
    ProgressIndicator,
    ProgressStep,
    RadioButton,
    RadioButtonGroup,
    RadioTile,
    RangeSlider,
    Search,
    Select,
    SelectableTile,
    SelectItem,
    Slider,
    Tab,
    TabContent,
    Tabs,
    Tag,
    TagInput,
    TextArea,
    TextInput,
    TileGroup,
    TimePicker,
    Toggle,
    Toggletip,
    Tooltip,
    TooltipDefinition,
    TooltipIcon,
    TreeView,
    UserAvatar,
  } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<!-- Every control below that passes aria-describedby="note" expects
     "Extra note" after its built-in description. -->
<p id="note">Extra note</p>

<h2>Text fields</h2>
<TextInput
  labelText="Email"
  helperText="We never share your email"
  aria-describedby="note"
/>
<TextInput
  labelText="Username"
  invalid
  invalidText="Username is taken"
  helperText="Letters and numbers only"
  aria-describedby="note"
/>
<TextInput
  labelText="Nickname"
  warn
  warnText="Nickname is public"
  aria-describedby="note"
/>
<PasswordInput
  labelText="Password"
  helperText="At least 12 characters"
  aria-describedby="note"
/>
<TextArea
  labelText="Bio"
  helperText="Shown on your profile"
  aria-describedby="note"
/>
<NumberInput
  labelText="Seats"
  helperText="Up to 10 seats"
  value={1}
  aria-describedby="note"
/>
<Search labelText="Find a service" aria-describedby="note" />
<CopyInput
  labelText="API key"
  helperText="Keep it secret"
  value="abc123"
  aria-describedby="note"
/>
<TagInput labelText="Tags" helperText="Up to 5 tags" />
<PinCodeInput
  labelText="Code"
  helperText="Sent by text message"
  aria-labelledby="pin-label"
  aria-describedby="note"
/>
<p id="pin-label">One-time code</p>

<h2>Selects and lists</h2>
<Select
  labelText="Region"
  helperText="Pick the closest region"
  aria-describedby="note"
>
  <SelectItem value="us" text="US" />
  <SelectItem value="eu" text="EU" />
</Select>
<ComboBox
  labelText="Channel"
  helperText="Where we send alerts"
  placeholder="Choose a channel"
  aria-describedby="note"
  {items}
/>
<Dropdown
  labelText="Contact"
  helperText="How we reach you"
  selectedId="0"
  aria-labelledby="dropdown-label"
  aria-describedby="note"
  {items}
/>
<p id="dropdown-label">Contact method</p>
<MultiSelect
  labelText="Notify by"
  helperText="Pick one or more"
  label="Choose methods"
  aria-describedby="note"
  {items}
/>
<DatePicker>
  <DatePickerInput
    labelText="Start date"
    helperText="mm/dd/yyyy"
    placeholder="mm/dd/yyyy"
    aria-describedby="note"
  />
</DatePicker>
<TimePicker
  labelText="Meeting time"
  helperText="24-hour clock"
  aria-describedby="note"
/>

<h2>Choices</h2>
<Checkbox
  labelText="Subscribe"
  helperText="One email a month"
  aria-describedby="note"
/>
<Toggle
  labelText="Auto-renew"
  warn
  warnText="You will be charged yearly"
  aria-describedby="note"
/>
<RadioButtonGroup legendText="Shipping" name="shipping">
  <RadioButton
    labelText="Standard"
    value="standard"
    aria-labelledby="radio-label"
    aria-describedby="note"
  />
  <RadioButton labelText="Express" value="express" />
</RadioButtonGroup>
<p id="radio-label">Standard shipping</p>
<Slider
  labelText="Volume"
  helperText="Applies to all devices"
  value={50}
  min={0}
  max={100}
  aria-describedby="note"
/>
<RangeSlider
  labelText="Price"
  valueFrom={10}
  valueTo={90}
  min={0}
  max={100}
  aria-labelledby="range-label"
/>
<p id="range-label">Price range</p>

<h2>Tiles</h2>
<p id="tile-help">Billed every month</p>
<TileGroup legend="Plan" name="plan">
  <RadioTile value="monthly" aria-describedby="tile-help">Monthly</RadioTile>
  <RadioTile value="yearly">Yearly</RadioTile>
</TileGroup>
<SelectableTile aria-label="Starter plan" aria-describedby="note">
  Starter
</SelectableTile>
<ExpandableTile
  hasInteractiveContent
  aria-label="Plan details"
  aria-describedby="note"
>
  <div slot="above">Above the fold</div>
  <div slot="below">Below the fold</div>
</ExpandableTile>

<h2>File uploaders</h2>
<FileUploader
  labelTitle="Resume"
  labelDescription="PDF only, up to 5 MB"
  buttonLabel="Add resume"
  status="edit"
  aria-describedby="note"
/>
<p id="button-label">Cover letter</p>
<p id="button-help">DOCX only</p>
<FileUploaderButton
  labelText="Add file"
  aria-labelledby="button-label"
  aria-describedby="button-help"
/>
<p id="drop-help">Max file size is 1 MB</p>
<FileUploaderDropContainer
  labelText="Drop files here"
  aria-describedby="drop-help"
/>

<h2>Disclosure</h2>
<Accordion>
  <AccordionItem title="Shipping policy" aria-describedby="note">
    Content
  </AccordionItem>
</Accordion>
<Disclosure summary="More details" aria-describedby="note">Content</Disclosure>
<Tabs>
  <Tab label="Calendar" aria-describedby="note" />
  <Tab label="Settings" />
  <svelte:fragment slot="content">
    <TabContent>Calendar content</TabContent>
    <TabContent>Settings content</TabContent>
  </svelte:fragment>
</Tabs>

<h2>Tooltips</h2>
<Tooltip open triggerText="Resources" aria-describedby="note">
  <p>Tip content</p>
</Tooltip>
<Toggletip aria-label="Show billing help" aria-describedby="note">
  Billing help
</Toggletip>
<TooltipDefinition tooltipText="Armonk, New York" aria-describedby="note">
  IBM
</TooltipDefinition>
<TooltipIcon
  tooltipText="Shown on invoices"
  aria-label="Invoice help"
  aria-describedby="note"
/>
<UserAvatar
  name="Ada Lovelace"
  tooltipText="Ada Lovelace"
  aria-label="Ada's profile"
  aria-describedby="note"
/>

<h2>Navigation and actions</h2>
<Breadcrumb>
  <BreadcrumbItem href="/reports" aria-describedby="note">
    Reports
  </BreadcrumbItem>
</Breadcrumb>
<ProgressIndicator>
  <ProgressStep
    label="Account"
    aria-label="Account step"
    aria-describedby="note"
  />
  <ProgressStep label="Billing" />
</ProgressIndicator>
<OverflowMenu open>
  <OverflowMenuItem text="Rename" aria-describedby="note" />
</OverflowMenu>
<ComboButton labelText="Save" aria-describedby="note" />
<Tag filter type="red" aria-label="Remove red filter" aria-describedby="note">
  Red
</Tag>

<h2>Data and status</h2>
<DataTable
  title="Services"
  description="All services"
  headers={[{ key: "name", value: "Name" }]}
  rows={[{ id: "a", name: "API" }]}
  aria-describedby="note"
/>
<ProgressBar
  labelText="Upload"
  helperText="40 of 100 MB"
  value={40}
  aria-describedby="note"
/>
<Meter
  labelText="Storage"
  helperText="Resets monthly"
  value={40}
  aria-describedby="note"
/>
<CodeSnippet
  type="multi"
  code={"npm i\nnpm run build"}
  aria-label="Install command"
  aria-describedby="note"
/>
<TreeView aria-label="Project files" nodes={[{ id: "src", text: "src" }]} />
<Carousel aria-label="Featured products">
  <CarouselItem>Slide 1</CarouselItem>
  <CarouselItem>Slide 2</CarouselItem>
</Carousel>
