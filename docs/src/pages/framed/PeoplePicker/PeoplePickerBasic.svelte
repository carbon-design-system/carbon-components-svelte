<script>
  import { PeoplePicker, Stack } from "carbon-components-svelte";

  const people = [
    {
      id: "u-1042",
      name: "Priya Raman",
      email: "priya.raman@example.com",
      secondary: "Platform engineering",
    },
    {
      id: "u-2290",
      name: "Marcus Oyelaran",
      email: "marcus.oyelaran@example.com",
      secondary: "Site reliability",
    },
    {
      id: "u-3118",
      name: "Hannah Lindqvist",
      email: "hannah.lindqvist@example.com",
      secondary: "Security",
    },
    {
      id: "u-4501",
      name: "Tomás Herrera",
      email: "tomas.herrera@example.com",
      secondary: "Data platform",
    },
  ];

  let value = [people[0]];
</script>

<Stack gap={5}>
  <PeoplePicker
    bind:value
    items={people}
    labelText="Assignees"
    helperText="Search by name or email"
    placeholder="Add people"
  />
  <p>Chosen: {value.map((person) => person.name).join(", ") || "nobody"}</p>
</Stack>
