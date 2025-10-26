<script lang="ts">
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
  } from "carbon-components-svelte";
</script>

<StructuredList>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head>
        <div data-testid="custom-header">Custom Header</div>
      </StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    <StructuredListRow>
      <StructuredListCell>
        <div data-testid="custom-content">Custom Content</div>
      </StructuredListCell>
    </StructuredListRow>
  </StructuredListBody>
</StructuredList>
