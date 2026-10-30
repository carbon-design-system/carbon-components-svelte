<script>
  import {
    AILabel,
    ComboBox,
    ContainedList,
    ContainedListItem,
    CopyInput,
    DataTable,
    DatePicker,
    DatePickerInput,
    HeaderSearch,
    NumberInput,
    PasswordInput,
    PinCodeInput,
    Search,
    Select,
    SelectItem,
    TagInput,
    TextArea,
    TextInput,
    TimePicker,
    TimePickerSelect,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  const headers = [{ key: "name", value: "Name" }];
  const rows = [{ id: "a", name: "Load balancer" }];
  const items = [{ id: "us-east", text: "US East" }];
</script>

<!-- One field per case, each a fixed width so its parts can be measured
     from its own edges in either direction. -->
<div class="cases">
  <div data-testid="text-invalid">
    <TextInput
      labelText="Service name"
      value="billing-api"
      invalid
      invalidText="Name is taken"
    />
  </div>
  <div data-testid="text-warn">
    <TextInput
      labelText="Service name"
      value="billing-api"
      warn
      warnText="Name is close to the limit"
    />
  </div>
  <div data-testid="text-readonly">
    <TextInput labelText="Service name" value="billing-api" readonly />
  </div>
  <div data-testid="text-decorator">
    <TextInput labelText="Service name" value="billing-api" invalid>
      <AILabel slot="decorator" />
    </TextInput>
  </div>
  <div data-testid="text-inline">
    <TextInput inline labelText="Region" value="us-east" />
  </div>
  <div data-testid="password">
    <PasswordInput labelText="API key" value="sk-live-4242" />
  </div>
  <div data-testid="password-sm">
    <PasswordInput size="sm" labelText="API key" value="sk-live-4242" />
  </div>
  <div data-testid="password-invalid">
    <PasswordInput
      labelText="API key"
      value="sk-live-4242"
      invalid
      invalidText="Key expired"
    />
  </div>
  <div data-testid="password-readonly">
    <PasswordInput labelText="API key" value="sk-live-4242" readonly />
  </div>
  <div data-testid="copy">
    <CopyInput labelText="Webhook URL" value="https://hooks.example.com/42" />
  </div>
  <div data-testid="copy-sm">
    <CopyInput
      size="sm"
      labelText="Webhook URL"
      value="https://hooks.example.com/42"
    />
  </div>
  <div data-testid="number">
    <NumberInput labelText="Replicas" value={3} />
  </div>
  <div data-testid="number-invalid">
    <NumberInput
      labelText="Replicas"
      value={3}
      invalid
      invalidText="Too many replicas"
    />
  </div>
  <div data-testid="number-sm-warn">
    <NumberInput
      size="sm"
      labelText="Replicas"
      value={3}
      warn
      warnText="Close to the quota"
    />
  </div>
  <div data-testid="number-nosteppers-invalid">
    <NumberInput
      hideSteppers
      labelText="Replicas"
      value={3}
      invalid
      invalidText="Too many replicas"
    />
  </div>
  <div data-testid="number-readonly-nosteppers">
    <NumberInput hideSteppers readonly labelText="Replicas" value={3} />
  </div>
  <div data-testid="number-decorator">
    <NumberInput labelText="Replicas" value={3} invalid>
      <AILabel slot="decorator" />
    </NumberInput>
  </div>
  <div data-testid="search">
    <Search value="incident 4012" />
  </div>
  <div data-testid="search-sm">
    <Search size="sm" value="incident 4012" />
  </div>
  <div data-testid="search-xl-invalid">
    <Search
      size="xl"
      value="incident 4012"
      invalid
      invalidText="Query is too long"
    />
  </div>
  <div data-testid="search-expandable">
    <Search expandable expanded value="incident 4012" />
  </div>
  <div data-testid="text-area-invalid">
    <TextArea
      labelText="Summary"
      value="Database failover at 02:14"
      invalid
      invalidText="Summary is required"
    />
  </div>
  <div data-testid="text-area-decorator">
    <TextArea labelText="Summary" value="Database failover at 02:14">
      <AILabel slot="decorator" />
    </TextArea>
  </div>
  <div data-testid="fluid-text-invalid">
    <TextInput
      fluid
      labelText="Service name"
      value="billing-api"
      invalid
      invalidText="Name is taken"
    />
  </div>
  <div data-testid="fluid-text-counter">
    <TextInput
      fluid
      labelText="Service name"
      value="billing-api"
      maxCount={20}
    />
  </div>
  <div data-testid="fluid-password-invalid">
    <PasswordInput
      fluid
      labelText="API key"
      value="sk-live-4242"
      invalid
      invalidText="Key expired"
    />
  </div>
  <div data-testid="fluid-copy">
    <CopyInput
      fluid
      labelText="Webhook URL"
      value="https://hooks.example.com/42"
    />
  </div>
  <div data-testid="fluid-number-invalid">
    <NumberInput
      fluid
      labelText="Replicas"
      value={3}
      invalid
      invalidText="Too many replicas"
    />
  </div>
  <div data-testid="fluid-search">
    <Search fluid labelText="Incidents" value="incident 4012" />
  </div>
  <div data-testid="fluid-search-invalid">
    <Search
      fluid
      labelText="Incidents"
      value="incident 4012"
      invalid
      invalidText="Query is too long"
    />
  </div>
  <div data-testid="fluid-text-area-invalid">
    <TextArea
      fluid
      labelText="Summary"
      value="Database failover at 02:14"
      invalid
      invalidText="Summary is required"
    />
  </div>
  <div data-testid="fluid-text-decorator">
    <TextInput fluid labelText="Service name" value="billing-api">
      <AILabel slot="decorator" />
    </TextInput>
  </div>
  <div data-testid="tag-input-invalid">
    <TagInput
      labelText="Labels"
      tags={["prod"]}
      invalid
      invalidText="Too many labels"
    />
  </div>
  <div data-testid="time-picker-invalid">
    <TimePicker labelText="Start" value="09:00" invalid invalidText="Invalid" />
  </div>
  <div data-testid="toolbar-search">
    <DataTable {headers} {rows}>
      <Toolbar>
        <ToolbarContent>
          <ToolbarSearch persistent value="Load" />
        </ToolbarContent>
      </Toolbar>
    </DataTable>
  </div>
  <div data-testid="contained-list-search">
    <ContainedList labelText="Team members">
      <Search value="Jane" />
      <ContainedListItem>Jane Cooper</ContainedListItem>
    </ContainedList>
  </div>
  <div data-testid="date-picker">
    <DatePicker datePickerType="single" value="03/15/2024">
      <DatePickerInput labelText="Start date" />
    </DatePicker>
  </div>
  <div data-testid="date-picker-invalid">
    <DatePicker datePickerType="single" value="03/15/2024">
      <DatePickerInput labelText="Start date" invalid invalidText="Too early" />
    </DatePicker>
  </div>
  <div data-testid="date-picker-warn">
    <DatePicker datePickerType="single" value="03/15/2024">
      <DatePickerInput labelText="Start date" warn warnText="A holiday" />
    </DatePicker>
  </div>
  <div data-testid="date-picker-clearable">
    <DatePicker datePickerType="single" value="03/15/2024" clearable>
      <DatePickerInput labelText="Start date" />
    </DatePicker>
  </div>
  <div data-testid="date-picker-clearable-invalid">
    <DatePicker datePickerType="single" value="03/15/2024" clearable>
      <DatePickerInput labelText="Start date" invalid invalidText="Too early">
        <AILabel slot="decorator" />
      </DatePickerInput>
    </DatePicker>
  </div>
  <div data-testid="date-picker-decorator">
    <DatePicker datePickerType="single" value="03/15/2024">
      <DatePickerInput labelText="Start date">
        <AILabel slot="decorator" />
      </DatePickerInput>
    </DatePicker>
  </div>
  <div data-testid="date-picker-range">
    <DatePicker
      datePickerType="range"
      valueFrom="03/12/2024"
      valueTo="03/14/2024"
    >
      <DatePickerInput labelText="Start date" />
      <DatePickerInput labelText="End date" />
    </DatePicker>
  </div>
  <div data-testid="select">
    <Select labelText="Region">
      <SelectItem value="us-east" text="US East" />
    </Select>
  </div>
  <div data-testid="select-invalid">
    <Select labelText="Region" invalid invalidText="Unavailable">
      <SelectItem value="us-east" text="US East" />
    </Select>
  </div>
  <div data-testid="select-warn">
    <Select labelText="Region" warn warnText="Busy">
      <SelectItem value="us-east" text="US East" />
    </Select>
  </div>
  <div data-testid="select-decorator">
    <Select labelText="Region" invalid invalidText="Unavailable">
      <SelectItem value="us-east" text="US East" />
      <AILabel slot="decorator" />
    </Select>
  </div>
  <div data-testid="select-inline">
    <Select inline labelText="Region" helperText="Closest first">
      <SelectItem value="us-east" text="US East" />
    </Select>
  </div>
  <div data-testid="select-inline-invalid">
    <Select inline labelText="Region" invalid invalidText="Unavailable">
      <SelectItem value="us-east" text="US East" />
    </Select>
  </div>
  <div data-testid="fluid-select">
    <Select fluid labelText="Region">
      <SelectItem value="us-east" text="US East" />
    </Select>
  </div>

  <!-- Other fluid fields share the label and message rows. -->
  <div data-testid="fluid-select-invalid">
    <Select fluid labelText="Region" invalid invalidText="Unavailable">
      <SelectItem value="us-east" text="US East" />
    </Select>
  </div>
  <div data-testid="fluid-combo-box-invalid">
    <ComboBox
      fluid
      labelText="Region"
      {items}
      invalid
      invalidText="Unavailable"
    />
  </div>
  <div data-testid="fluid-date-picker-invalid">
    <DatePicker fluid datePickerType="single">
      <DatePickerInput labelText="Start date" invalid invalidText="Too early" />
    </DatePicker>
  </div>
  <div data-testid="fluid-time-picker-invalid">
    <TimePicker
      fluid
      labelText="Start"
      value="09:00"
      invalid
      invalidText="Invalid"
    />
  </div>
  <div data-testid="fluid-time-picker-selects">
    <TimePicker fluid labelText="Time" value="09:00">
      <TimePickerSelect labelText="Period" value="am">
        <SelectItem value="am" text="AM" />
        <SelectItem value="pm" text="PM" />
      </TimePickerSelect>
      <TimePickerSelect labelText="Timezone" value="et">
        <SelectItem value="et" text="Eastern Time (ET)" />
        <SelectItem value="pt" text="Pacific Time (PT)" />
      </TimePickerSelect>
    </TimePicker>
  </div>
  <div data-testid="fluid-pin-code-invalid">
    <PinCodeInput
      fluid
      labelText="Code"
      count={4}
      invalid
      invalidText="Wrong code"
    />
  </div>
  <div data-testid="header-search">
    <HeaderSearch />
  </div>
</div>

<style>
  .cases > :global(div) {
    width: 20rem;
    margin-bottom: 1rem;
  }
</style>
