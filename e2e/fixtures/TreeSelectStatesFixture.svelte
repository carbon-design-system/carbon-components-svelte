<script>
  import { FluidForm, Stack, TreeSelect } from "carbon-components-svelte";

  const nodes = [
    {
      id: "eu",
      text: "Europe",
      nodes: [
        {
          id: "de",
          text: "Germany",
          nodes: [
            { id: "berlin", text: "Berlin" },
            { id: "munich", text: "Munich" },
          ],
        },
        { id: "fr", text: "France", nodes: [{ id: "paris", text: "Paris" }] },
        { id: "is", text: "Iceland", disabled: true },
      ],
    },
    { id: "an", text: "Antarctica" },
  ];

  const sizes = ["xs", "sm", undefined, "lg"];
  const states = [
    { name: "invalid", invalid: true, invalidText: "Choose a location" },
    { name: "warn", warn: true, warnText: "This region is closing" },
    { name: "readonly", readonly: true },
    { name: "disabled", disabled: true },
  ];
</script>

<div id="host" style="max-width: 28rem; padding: 1rem">
  <Stack gap={6}>
    {#each sizes as size}
      <div data-testid="size-{size ?? 'md'}">
        <TreeSelect
          labelText="Size {size ?? 'md'}"
          label="Choose a location"
          {nodes}
          {size}
          selectedId="berlin"
        />
      </div>
    {/each}
    {#each states as state}
      <div data-testid="single-{state.name}">
        <TreeSelect
          labelText="Single {state.name}"
          label="Choose a location"
          {nodes}
          selectedId="paris"
          invalid={state.invalid}
          invalidText={state.invalidText}
          warn={state.warn}
          warnText={state.warnText}
          readonly={state.readonly}
          disabled={state.disabled}
          helperText="Helper text"
        />
      </div>
      <div data-testid="multi-{state.name}">
        <TreeSelect
          labelText="Multi {state.name}"
          label="Choose locations"
          {nodes}
          selectionMode="checkbox"
          selectionDisplay="tags"
          checkedIds={["de", "an"]}
          invalid={state.invalid}
          invalidText={state.invalidText}
          warn={state.warn}
          warnText={state.warnText}
          readonly={state.readonly}
          disabled={state.disabled}
          helperText="Helper text"
        />
      </div>
      <div data-testid="search-{state.name}">
        <TreeSelect
          labelText="Search {state.name}"
          {nodes}
          filterable
          selectedId="paris"
          invalid={state.invalid}
          invalidText={state.invalidText}
          warn={state.warn}
          warnText={state.warnText}
          readonly={state.readonly}
          disabled={state.disabled}
          helperText="Helper text"
        />
      </div>
    {/each}
    <FluidForm>
      <div data-testid="fluid">
        <TreeSelect
          labelText="Fluid"
          label="Choose a location"
          {nodes}
          selectedId="berlin"
        />
      </div>
      <div data-testid="fluid-multi">
        <TreeSelect
          labelText="Fluid multi"
          label="Choose locations"
          {nodes}
          selectionMode="checkbox"
          checkedIds={["de"]}
        />
      </div>
    </FluidForm>
  </Stack>
</div>
