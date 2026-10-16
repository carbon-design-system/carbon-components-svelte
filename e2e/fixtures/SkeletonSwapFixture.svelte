<script>
  import {
    ComboBox,
    ComboBoxSkeleton,
    CopyInput,
    CopyInputSkeleton,
    DatePicker,
    DatePickerInput,
    DatePickerSkeleton,
    Dropdown,
    DropdownSkeleton,
    FluidTextAreaSkeleton,
    MultiSelect,
    MultiSelectSkeleton,
    NumberInput,
    NumberInputSkeleton,
    PasswordInput,
    PasswordInputSkeleton,
    PinCodeInput,
    PinCodeInputSkeleton,
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
      <div data-part="skeleton"><DatePickerSkeleton {size} /></div>
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
  <div data-testid="date-picker-range">
    <div data-part="real">
      <DatePicker datePickerType="range">
        <DatePickerInput labelText="From" />
        <DatePickerInput labelText="To" />
      </DatePicker>
    </div>
    <div data-part="skeleton"><DatePickerSkeleton range /></div>
  </div>
  <div data-testid="pin-code-input">
    <div data-part="real"><PinCodeInput labelText="Code" /></div>
    <div data-part="skeleton"><PinCodeInputSkeleton /></div>
  </div>
</div>
