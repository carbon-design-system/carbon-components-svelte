<script>
  import { DataTable } from "carbon-components-svelte";
</script>

<DataTable
  headers={[
    { key: "name", value: "Name", sticky: "start", minWidth: "12rem" },
    { key: "id", value: "ID", minWidth: "6rem" },
    { key: "email", value: "Email", minWidth: "16rem" },
    { key: "department", value: "Department", minWidth: "12rem" },
    { key: "role", value: "Role", minWidth: "14rem" },
    { key: "location", value: "Location", minWidth: "12rem" },
    { key: "lastActive", value: "Last active", minWidth: "10rem" },
    { key: "status", value: "Status", sticky: "end", minWidth: "8rem" },
  ]}
  rows={[
    {
      id: "1",
      name: "Aiko Tanaka",
      email: "aiko.tanaka@example.com",
      department: "Engineering",
      role: "Senior Software Engineer",
      location: "Tokyo, Japan",
      status: "Active",
      lastActive: "2 minutes ago",
    },
    {
      id: "2",
      name: "Marcus Johnson",
      email: "marcus.johnson@example.com",
      department: "Product Management",
      role: "Principal Product Manager",
      location: "Austin, Texas",
      status: "Active",
      lastActive: "1 hour ago",
    },
    {
      id: "3",
      name: "Fatima Al-Sayed",
      email: "fatima.alsayed@example.com",
      department: "Customer Success",
      role: "Customer Success Lead",
      location: "Dubai, UAE",
      status: "Away",
      lastActive: "Yesterday",
    },
  ]}
/>
