<script>
  import { Mentions, TextArea } from "carbon-components-svelte";

  let ref = null;
  let value = "";

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
    const text = `${given[i % given.length]} ${family[Math.floor(i / given.length) % family.length]} ${i}`;
    return { id: `u-${i}`, text, secondary: `@user${i}` };
  });
</script>

<TextArea
  bind:ref
  bind:value
  labelText="Comment"
  helperText="Searches 10,000 accounts as you type"
/>
<Mentions field={ref} triggers={[{ char: "@", items: accounts }]} />
