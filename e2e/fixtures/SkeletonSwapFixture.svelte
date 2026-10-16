<script>
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbSkeleton,
    CodeSnippet,
    CodeSnippetSkeleton,
    ComboBox,
    ComboBoxSkeleton,
    CopyInput,
    CopyInputSkeleton,
    DatePicker,
    DatePickerInput,
    DatePickerSkeleton,
    Dropdown,
    DropdownSkeleton,
    FileUploader,
    FileUploaderSkeleton,
    FluidDatePickerSkeleton,
    FluidPinCodeInputSkeleton,
    FluidTextAreaSkeleton,
    MultiSelect,
    MultiSelectSkeleton,
    NumberInput,
    NumberInputSkeleton,
    Pagination,
    PaginationSkeleton,
    PasswordInput,
    PasswordInputSkeleton,
    PinCodeInput,
    PinCodeInputSkeleton,
    ProgressIndicator,
    ProgressIndicatorSkeleton,
    ProgressStep,
    RadioButton,
    RadioButtonSkeleton,
    RangeSlider,
    RangeSliderSkeleton,
    Search,
    SearchSkeleton,
    Select,
    SelectItem,
    SelectSkeleton,
    Slider,
    SliderSkeleton,
    TextArea,
    TextAreaSkeleton,
    TextInput,
    TextInputSkeleton,
    TimePicker,
    TimePickerSelect,
    TimePickerSkeleton,
    Toggle,
    ToggleSkeleton,
  } from "carbon-components-svelte";

  const sizes = ["xs", "sm", undefined, "xl"];
  const listBoxSizes = ["xs", "sm", undefined, "lg", "xl"];
  const items = [{ id: "eu", text: "Europe" }];
</script>

<!-- Each case renders a component and the skeleton that stands in for it,
     at the same size, in equal-width boxes. -->
<div style="width: 320px; display: grid; gap: 2rem;">
  {#each sizes as size}
    {@const at = size ?? "md"}
    <div data-testid="text-input-{at}">
      <div data-part="real"><TextInput {size} labelText="Name" /></div>
      <div data-part="skeleton"><TextInputSkeleton {size} /></div>
    </div>
    <div data-testid="password-input-{at}">
      <div data-part="real">
        <PasswordInput {size} labelText="Password" />
      </div>
      <div data-part="skeleton"><PasswordInputSkeleton {size} /></div>
    </div>
    <div data-testid="number-input-{at}">
      <div data-part="real">
        <NumberInput {size} labelText="Count" value={1} />
      </div>
      <div data-part="skeleton"><NumberInputSkeleton {size} /></div>
    </div>
    <div data-testid="select-{at}">
      <div data-part="real">
        <Select {size} labelText="Region"><SelectItem value="eu" /></Select>
      </div>
      <div data-part="skeleton"><SelectSkeleton {size} /></div>
    </div>
    <div data-testid="copy-input-{at}">
      <div data-part="real">
        <CopyInput {size} labelText="Key" value="abc" />
      </div>
      <div data-part="skeleton"><CopyInputSkeleton {size} /></div>
    </div>
    <div data-testid="date-picker-{at}">
      <div data-part="real">
        <DatePicker datePickerType="single">
          <DatePickerInput {size} labelText="Date" />
        </DatePicker>
      </div>
      <div data-part="skeleton">
        <DatePickerSkeleton {size} datePickerType="single" />
      </div>
    </div>
  {/each}
  {#each listBoxSizes as size}
    {@const at = size ?? "md"}
    <div data-testid="dropdown-{at}">
      <div data-part="real">
        <Dropdown {size} labelText="Region" {items} selectedId="eu" />
      </div>
      <div data-part="skeleton"><DropdownSkeleton {size} /></div>
    </div>
    <div data-testid="combo-box-{at}">
      <div data-part="real">
        <ComboBox {size} labelText="Region" {items} />
      </div>
      <div data-part="skeleton"><ComboBoxSkeleton {size} /></div>
    </div>
    <div data-testid="multi-select-{at}">
      <div data-part="real">
        <MultiSelect {size} labelText="Region" {items} />
      </div>
      <div data-part="skeleton"><MultiSelectSkeleton {size} /></div>
    </div>
  {/each}
  <div data-testid="dropdown-inline">
    <div data-part="real">
      <Dropdown type="inline" labelText="Region" {items} selectedId="eu" />
    </div>
    <div data-part="skeleton"><DropdownSkeleton inline /></div>
  </div>
  <div data-testid="multi-select-inline">
    <div data-part="real">
      <MultiSelect type="inline" labelText="Region" {items} />
    </div>
    <div data-part="skeleton"><MultiSelectSkeleton inline /></div>
  </div>
  <div data-testid="dropdown-hidden-label">
    <div data-part="real">
      <Dropdown hideLabel labelText="Region" {items} selectedId="eu" />
    </div>
    <div data-part="skeleton"><DropdownSkeleton hideLabel /></div>
  </div>
  {#each ["xs", "sm", "lg", "xl"] as size}
    <div data-testid="search-{size}">
      <div data-part="real"><Search {size} labelText="Search" /></div>
      <div data-part="skeleton"><SearchSkeleton {size} /></div>
    </div>
  {/each}
  {#each [1, 2, 4, 8] as rows}
    <div data-testid="text-area-{rows}">
      <div data-part="real"><TextArea {rows} labelText="Notes" /></div>
      <div data-part="skeleton"><TextAreaSkeleton {rows} /></div>
    </div>
    <div data-testid="fluid-text-area-{rows}">
      <div data-part="real"><TextArea fluid {rows} labelText="Notes" /></div>
      <div data-part="skeleton"><FluidTextAreaSkeleton {rows} /></div>
    </div>
  {/each}
  {#each ["default", "sm"] as size}
    <div data-testid="toggle-{size}">
      <div data-part="real"><Toggle {size} labelText="Alerts" /></div>
      <div data-part="skeleton">
        <ToggleSkeleton {size} labelText="Alerts" />
      </div>
    </div>
    <div data-testid="toggle-{size}-hidden-label">
      <div data-part="real">
        <Toggle {size} hideLabel labelText="Alerts" />
      </div>
      <div data-part="skeleton">
        <ToggleSkeleton {size} hideLabel labelText="Alerts" />
      </div>
    </div>
    <div data-testid="toggle-{size}-no-label">
      <div data-part="real"><Toggle {size} /></div>
      <div data-part="skeleton"><ToggleSkeleton {size} /></div>
    </div>
  {/each}
  {#each ["xs", undefined] as size}
    {@const at = size ?? "md"}
    <div data-testid="slider-{at}">
      <div data-part="real">
        <Slider {size} labelText="Volume" value={40} />
      </div>
      <div data-part="skeleton"><SliderSkeleton {size} /></div>
    </div>
    <div data-testid="range-slider-{at}">
      <div data-part="real">
        <RangeSlider {size} labelText="Price" valueFrom={20} valueTo={60} />
      </div>
      <div data-part="skeleton"><RangeSliderSkeleton {size} /></div>
    </div>
  {/each}
  <div data-testid="slider-hidden-input">
    <div data-part="real">
      <Slider hideTextInput labelText="Volume" value={40} />
    </div>
    <div data-part="skeleton"><SliderSkeleton hideTextInput /></div>
  </div>
  <div data-testid="radio-button">
    <div data-part="real"><RadioButton labelText="Daily" value="d" /></div>
    <div data-part="skeleton"><RadioButtonSkeleton /></div>
  </div>
  <div data-testid="date-picker-range">
    <div data-part="real">
      <DatePicker datePickerType="range">
        <DatePickerInput labelText="From" />
        <DatePickerInput labelText="To" />
      </DatePicker>
    </div>
    <div data-part="skeleton">
      <DatePickerSkeleton datePickerType="range" />
    </div>
  </div>
  {#each [320, 200] as width}
    <div data-testid="fluid-date-picker-{width}" style:width="{width}px">
      <div data-part="real">
        <DatePicker fluid datePickerType="single">
          <DatePickerInput labelText="Date" />
        </DatePicker>
      </div>
      <div data-part="skeleton"><FluidDatePickerSkeleton /></div>
    </div>
  {/each}
  {#each sizes as size}
    {@const at = size ?? "md"}
    <div data-testid="time-picker-{at}">
      <div data-part="real">
        <TimePicker {size} labelText="Time" placeholder="hh:mm">
          <TimePickerSelect value="pm" labelText="AM or PM">
            <SelectItem value="am" text="AM" />
            <SelectItem value="pm" text="PM" />
          </TimePickerSelect>
          <TimePickerSelect value="pdt" labelText="Time zone">
            <SelectItem value="pdt" text="PDT" />
            <SelectItem value="gmt" text="GMT" />
          </TimePickerSelect>
        </TimePicker>
      </div>
      <div data-part="skeleton"><TimePickerSkeleton {size} /></div>
    </div>
  {/each}
  {#each ["xs", "sm", "md", "lg"] as size}
    <div data-testid="pagination-{size}">
      <div data-part="real">
        <Pagination {size} totalItems={120} pageSizes={[10, 20]} />
      </div>
      <div data-part="skeleton"><PaginationSkeleton {size} /></div>
    </div>
  {/each}
  {#each ["small", "field", "default"] as size}
    <div data-testid="file-uploader-{size}">
      <div data-part="real">
        <FileUploader
          {size}
          labelTitle="Upload files"
          labelDescription="Max file size is 500 MB."
          buttonLabel="Add file"
        />
      </div>
      <div data-part="skeleton"><FileUploaderSkeleton {size} /></div>
    </div>
  {/each}
  {#each ["sm", "md"] as size}
    <div data-testid="breadcrumb-{size}" style="width: 340px">
      <div data-part="real">
        <Breadcrumb {size}>
          <BreadcrumbItem href="/">Projects</BreadcrumbItem>
          <BreadcrumbItem href="/">billing-api</BreadcrumbItem>
          <BreadcrumbItem href="/" isCurrentPage>Settings</BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div data-part="skeleton"><BreadcrumbSkeleton {size} /></div>
    </div>
  {/each}
  {#each [{}, { spaceEqually: true }, { vertical: true }] as layout, i}
    <div data-testid="progress-indicator-{i}">
      <div data-part="real">
        <ProgressIndicator currentIndex={1} {...layout}>
          <ProgressStep label="Account" complete />
          <ProgressStep label="Billing" />
          <ProgressStep label="Review" />
        </ProgressIndicator>
      </div>
      <div data-part="skeleton">
        <ProgressIndicatorSkeleton count={3} {...layout} />
      </div>
    </div>
  {/each}
  <div data-testid="code-snippet-single">
    <div data-part="real">
      <CodeSnippet code="npm i carbon-components-svelte" />
    </div>
    <div data-part="skeleton"><CodeSnippetSkeleton /></div>
  </div>
  <div data-testid="code-snippet-multi">
    <div data-part="real">
      <CodeSnippet type="multi" code={"one\ntwo\nthree"} />
    </div>
    <div data-part="skeleton"><CodeSnippetSkeleton type="multi" /></div>
  </div>
  <div data-testid="date-picker-simple">
    <div data-part="real">
      <DatePicker><DatePickerInput labelText="Date" /></DatePicker>
    </div>
    <div data-part="skeleton"><DatePickerSkeleton /></div>
  </div>
  <div data-testid="date-picker-short">
    <div data-part="real">
      <DatePicker short><DatePickerInput labelText="Date" /></DatePicker>
    </div>
    <div data-part="skeleton"><DatePickerSkeleton short /></div>
  </div>
  {#each [4, 6] as count}
    <div data-testid="fluid-pin-code-input-{count}">
      <div data-part="real">
        <PinCodeInput fluid {count} labelText="Code" />
      </div>
      <div data-part="skeleton"><FluidPinCodeInputSkeleton {count} /></div>
    </div>
  {/each}
  {#each ["xs", "sm", "default", "xl"] as size}
    <div data-testid="pin-code-input-{size}">
      <div data-part="real">
        <PinCodeInput {size} count={6} labelText="Code" />
      </div>
      <div data-part="skeleton">
        <PinCodeInputSkeleton {size} count={6} />
      </div>
    </div>
  {/each}
</div>
