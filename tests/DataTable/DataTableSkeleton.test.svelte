<script lang="ts">
  import { DataTableSkeleton } from "carbon-components-svelte";

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2869
  // DataTableSkeletonProps should not require `key` / `empty` from DataTableHeader.
</script>

<DataTableSkeleton
  size="tall"
  showHeader={false}
  showToolbar={false}
  rows={10}
/>

<DataTableSkeleton />

<DataTableSkeleton headers={["Name", "Protocol", "Port", "Rule"]} rows={10} />

<DataTableSkeleton
  headers={[{ value: "Name" }, { value: "Protocol" }, { value: "Port" }, { value: "Rule" }]}
  rows={10}
/>

<DataTableSkeleton
  headers={[{ value: "Name" }, { value: "Protocol" }, { value: "Port" }, { value: "Rule" }, { empty: true }]}
  rows={10}
/>

<DataTableSkeleton showHeader={false} showToolbar={false} />

<DataTableSkeleton showHeader={false} showToolbar={false} size="tall" />

<DataTableSkeleton showHeader={false} showToolbar={false} size="short" />

<DataTableSkeleton showHeader={false} showToolbar={false} size="compact" />
