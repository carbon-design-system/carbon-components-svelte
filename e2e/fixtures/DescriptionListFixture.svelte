<script lang="ts">
  import {
    DescriptionList,
    DescriptionListItem,
  } from "carbon-components-svelte";
</script>

<div data-testid="summary" style="width: 240px">
  <DescriptionList layout="summary" gap={3}>
    <DescriptionListItem term="Subtotal">$128.00</DescriptionListItem>
    <DescriptionListItem
      term="Two nights at the riverside hotel with breakfast"
    >
      $1,240.00
    </DescriptionListItem>
    <DescriptionListItem term="Total" total>$1,368.00</DescriptionListItem>
  </DescriptionList>
</div>
