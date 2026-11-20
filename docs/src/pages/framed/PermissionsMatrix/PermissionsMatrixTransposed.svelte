<script>
  import { PermissionsMatrix } from "carbon-components-svelte";

  const roles = [
    { id: "viewer", label: "Viewer" },
    { id: "editor", label: "Editor", parent: "viewer" },
    { id: "admin", label: "Administrator", parent: "editor" },
    { id: "auditor", label: "Auditor" },
  ];

  const permissions = [
    {
      id: "clusters",
      label: "Clusters",
      children: [
        { id: "clusters.view", label: "View clusters" },
        { id: "clusters.scale", label: "Scale clusters" },
        { id: "clusters.delete", label: "Delete clusters" },
      ],
    },
    {
      id: "images",
      label: "Images",
      children: [
        { id: "images.pull", label: "Pull images" },
        { id: "images.push", label: "Push images" },
      ],
    },
  ];

  let value = {
    viewer: { "clusters.view": true, "images.pull": true },
    editor: { "clusters.scale": true, "images.push": true },
    auditor: { "clusters.view": true },
  };
</script>

<PermissionsMatrix
  bind:value
  transposed
  headerLayout="rotated"
  size="short"
  labelText="Cluster roles"
  {roles}
  {permissions}
/>
