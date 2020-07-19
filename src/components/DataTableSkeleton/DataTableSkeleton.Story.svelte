<script>
  import Layout from "../../internal/ui/Layout.svelte";
  import DataTableSkeleton from "./DataTableSkeleton.svelte";
</script>

<Layout>
  <div style="width: 800px">
    <DataTableSkeleton {...$$props} />
  </div>
</Layout>
