<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";

  export let mode: "bind-group" | "checkbox-group" = "bind-group";
  export let group: string[] = [];
</script>

<form data-testid="form">
  {#if mode === "bind-group"}
    <Checkbox bind:group name="channel" value="a" labelText="A" />
    <Checkbox bind:group name="channel" value="b" labelText="B" />
  {:else}
    <CheckboxGroup bind:selected={group} name="channel" legendText="Channel">
      <Checkbox value="a" labelText="A" />
      <Checkbox value="b" labelText="B" />
    </CheckboxGroup>
  {/if}
</form>
<p data-testid="group">{group.join(",")}</p>
