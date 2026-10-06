<script lang="ts">
  import StructuredList from "carbon-components-svelte/StructuredList/StructuredList.svelte";
  import StructuredListBody from "carbon-components-svelte/StructuredList/StructuredListBody.svelte";
  import StructuredListCell from "carbon-components-svelte/StructuredList/StructuredListCell.svelte";
  import StructuredListInput from "carbon-components-svelte/StructuredList/StructuredListInput.svelte";
  import StructuredListRow from "carbon-components-svelte/StructuredList/StructuredListRow.svelte";

  export let name: string | undefined = undefined;
  export let multiple = false;
</script>

<StructuredList selection {multiple} {name}>
  <StructuredListBody>
    <StructuredListRow label for="plan-a">
      <StructuredListInput id="plan-a" value="a" />
      <StructuredListCell>Plan A</StructuredListCell>
    </StructuredListRow>
    <StructuredListRow label for="plan-b">
      <StructuredListInput id="plan-b" value="b" />
      <StructuredListCell>Plan B</StructuredListCell>
    </StructuredListRow>
  </StructuredListBody>
</StructuredList>
