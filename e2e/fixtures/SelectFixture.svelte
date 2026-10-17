<script>
  import { Select, SelectItem } from "carbon-components-svelte";

  let selected = "";
</script>

<div data-testid="fluid-invalid" style="width: 320px">
  <Select fluid labelText="Region" invalid invalidText="Fix this value">
    <SelectItem value="eu" text="EU Germany" />
  </Select>
</div>

<Select data-testid="select-country" labelText="Country" bind:selected>
  <SelectItem value="us" text="United States" />
  <SelectItem value="uk" text="United Kingdom" />
  <SelectItem value="ca" text="Canada" />
  <SelectItem value="de" text="Germany" />
</Select>

{#if selected}
  <p data-testid="selected-value">Selected: {selected}</p>
{/if}

<div data-testid="inline-helper">
  <Select inline labelText="Region" helperText="Shown under the field">
    <SelectItem value="eu" text="EU Germany" />
  </Select>
</div>
<div data-testid="inline-warning">
  <Select inline labelText="Region" warn warnText="Check this value">
    <SelectItem value="eu" text="EU Germany" />
  </Select>
</div>

<!-- Inline selects with long text under the field, in narrow containers. -->
{#each [240, 320] as width (width)}
  <div data-testid="inline-narrow-{width}" style="width: {width}px">
    <Select
      inline
      labelText="Region"
      helperText="Shown under the field, and long enough to wrap onto a second line"
    >
      <SelectItem value="eu" text="EU Germany" />
    </Select>
    <Select
      inline
      labelText="Region"
      invalid
      invalidText="This value is not available, so choose another one"
    >
      <SelectItem value="eu" text="EU Germany" />
    </Select>
    <Select
      inline
      labelText="Region"
      warn
      warnText="This value is almost full, so consider another one"
    >
      <SelectItem value="eu" text="EU Germany" />
    </Select>
  </div>
{/each}
