<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";

  export let mode: "bind-group" | "checkbox-group" = "bind-group";
  export let group: string[] = [];
  export let required = false;
  export let onCheck: (event: CustomEvent<boolean>) => void = () => {};
  export let onChange: (
    event: CustomEvent<ReadonlyArray<string | number>>,
  ) => void = () => {};
</script>

<form data-testid="form">
  {#if mode === "bind-group"}
    <Checkbox
      bind:group
      name="channel"
      value="a"
      labelText="A"
      on:check={onCheck}
    />
    <Checkbox
      bind:group
      name="channel"
      value="b"
      labelText="B"
      on:check={onCheck}
    />
  {:else}
    <CheckboxGroup
      bind:selected={group}
      {required}
      name="channel"
      legendText="Channel"
      on:change={onChange}
    >
      <Checkbox value="a" labelText="A" on:check={onCheck} />
      <Checkbox value="b" labelText="B" on:check={onCheck} />
    </CheckboxGroup>
  {/if}
</form>
<p data-testid="group">{group.join(",")}</p>
