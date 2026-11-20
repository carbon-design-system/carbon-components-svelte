<script>
  import { PeoplePicker } from "carbon-components-svelte";

  const people = [
    { id: "u-1042", name: "Priya Raman", email: "priya.raman@example.com" },
    { id: "u-2290", name: "Marcus Oyelaran", email: "marcus@example.com" },
    { id: "u-3118", name: "Hannah Lindqvist", email: "hannah@example.com" },
  ];

  let value = [people[1]];
</script>

<PeoplePicker
  bind:value
  items={people}
  multiple={false}
  labelText="Owner"
  placeholder="Choose an owner"
/>
