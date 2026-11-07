<script>
  import {
    fuzzyMatchText,
    SearchMenu,
    SearchMenuItem,
  } from "carbon-components-svelte";

  let value = "cafe";

  const places = [
    "Café Central",
    "Crème Brûlée Bakery",
    "İstanbul Kitchen",
    "Müller Straße 5",
    "Naïve Studio",
  ];

  // `fuzzyMatchText` ignores case and accents, and returns `ranges` into the
  // original text, so the menu marks "Café" for "cafe" and "İstanbul" for
  // "istanbul". The default matcher compares plain lowercase letters.
  const match = (text, query) => {
    const { matched, ranges } = fuzzyMatchText(text, query);
    return { matched, ranges };
  };
</script>

<SearchMenu bind:value {match} labelText="Search" placeholder="Search...">
  {#each places as text (text)}
    <SearchMenuItem {text} />
  {/each}
</SearchMenu>
