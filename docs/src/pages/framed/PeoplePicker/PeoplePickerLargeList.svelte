<script>
  import { PeoplePicker } from "carbon-components-svelte";

  const given = [
    "Priya",
    "Marcus",
    "Hannah",
    "Tomás",
    "Wei",
    "Amara",
    "Lucas",
    "Noor",
  ];
  const family = [
    "Raman",
    "Oyelaran",
    "Lindqvist",
    "Herrera",
    "Zhang",
    "Okafor",
    "Silva",
    "Haddad",
  ];

  // 10,000 accounts. The first query ranks them in a single pass and stops
  // as soon as enough names start with it.
  const accounts = Array.from({ length: 10_000 }, (_, i) => {
    const name = `${given[i % given.length]} ${family[Math.floor(i / given.length) % family.length]} ${i}`;
    return {
      id: `u-${i}`,
      name,
      email: `user${i}@example.com`,
      secondary: "Engineering",
    };
  });

  let value = [];
</script>

<PeoplePicker
  bind:value
  items={accounts}
  labelText="Everyone"
  helperText="Searches 10,000 accounts as you type"
/>
