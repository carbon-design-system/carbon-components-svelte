<script>
  import { Button, IndexedList, Stack, Text } from "carbon-components-svelte";

  const names =
    "Aisha Khan,Amara Okafor,Ben Weber,Camila Castillo,Chen Xu,Dara Banerjee,Diego Garcia,Elif Yilmaz,Farah Haddad,Gabriel Santos,Hana Ito,Imani Mensah,Jia Zhang,Kofi Adeyemi,Laila Dubois,Mateo Rossi,Mei Tanaka,Nadia Petrov,Omar Umar,Priya Lindqvist,Rafael Vargas,Sofia Quispe,Tariq Fofana,Wei Nakamura,Yara Eriksen,Zane Jovanovic";
  const contacts = names.split(",").map((name, id) => ({ id, name }));

  let list;
  let currentSection;
</script>

<Stack gap={5}>
  <Stack orientation="horizontal" gap={3}>
    <Button
      size="sm"
      kind="tertiary"
      on:click={() => list.scrollToSection("F")}
    >
      Go to F
    </Button>
    <Button
      size="sm"
      kind="tertiary"
      on:click={() => list.scrollToSection("S", { focus: true })}
    >
      Go to S and focus its header
    </Button>
  </Stack>
  <Text>Section at the top: {currentSection ?? "none"}</Text>
  <IndexedList
    bind:this={list}
    bind:currentSection
    items={contacts}
    itemToString={(contact) => contact.name}
    labelText="Contacts"
    height={320}
    let:item
  >
    {item.name}
  </IndexedList>
</Stack>
