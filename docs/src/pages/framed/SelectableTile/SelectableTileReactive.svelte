<script>
  import {
    SelectableTileGroup,
    SelectableTile,
    Button,
  } from "carbon-components-svelte";

  let selectedValues = ["1"];
  let selectedValues2 = [];
  let selectedValues3 = [];
  let selectedValues3_control = [
    { value: "1", selected: true },
    { value: "2", selected: false },
    { value: "3", selected: false },
  ];
</script>

<SelectableTileGroup
  bind:selectedValues
  legend="Select the options you require"
>
  <SelectableTile title="Option 1" value="1">Option 1</SelectableTile>
  <SelectableTile title="Option 2" value="2">Option 2</SelectableTile>
  <SelectableTile title="Option 3" value="3">
    Option 3 (light variant)
  </SelectableTile>
</SelectableTileGroup>

<div>
  {selectedValues.join(', ')}

  <Button
    on:click="{() => {
      selectedValues = [];
    }}"
  >
    Reset selectedValues
  </Button>
</div>

<SelectableTileGroup
  bind:selectedValues="{selectedValues2}"
  legend="Select the options you require"
>
  <SelectableTile title="Option 1" value="1">Option 1</SelectableTile>
  <SelectableTile title="Option 2" value="2" selected>Option 2</SelectableTile>
  <SelectableTile title="Option 3" selected value="3">
    Option 3 (light variant)
  </SelectableTile>
</SelectableTileGroup>

<div>
  {selectedValues2.join(', ')}

  <Button
    on:click="{() => {
      selectedValues2 = [];
    }}"
  >
    Reset selectedValues2
  </Button>
</div>

<SelectableTileGroup
  bind:selectedValues="{selectedValues3}"
  legend="Select the options you require"
>
  {#each selectedValues3_control as item}
    <SelectableTile value="{item.value}" selected="{item.selected}">
      {item.value}
    </SelectableTile>
  {/each}
</SelectableTileGroup>

<div>
  {selectedValues3.join(', ')}

  <Button
    on:click="{() => {
      selectedValues3_control = selectedValues3_control.map((item) => {
        return { ...item, selected: false };
      });
    }}"
  >
    Reset selectedValues3
  </Button>
</div>
