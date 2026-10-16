<script>
  import {
    CopyInput,
    CopyInputSkeleton,
    DatePicker,
    DatePickerInput,
    DatePickerSkeleton,
    NumberInput,
    NumberInputSkeleton,
    PasswordInput,
    PasswordInputSkeleton,
    PinCodeInput,
    PinCodeInputSkeleton,
    Select,
    SelectItem,
    SelectSkeleton,
    TextInput,
    TextInputSkeleton,
  } from "carbon-components-svelte";

  const sizes = ["xs", "sm", undefined, "xl"];
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
