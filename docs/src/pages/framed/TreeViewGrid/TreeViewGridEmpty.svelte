<script>
  import { Link, TreeViewGrid } from "carbon-components-svelte";

  const headers = [
    { key: "text", value: "Name" },
    { key: "status", value: "Status" },
    { key: "owner", value: "Owner" },
  ];
</script>

<TreeViewGrid labelText="Cloud resources" {headers} nodes={[]}>
  <svelte:fragment slot="empty">
    No resources in this account yet.
    <Link href="#create">Create a resource</Link>
  </svelte:fragment>
</TreeViewGrid>
