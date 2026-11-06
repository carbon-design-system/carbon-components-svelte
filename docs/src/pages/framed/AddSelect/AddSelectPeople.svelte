<script lang="ts">
  import { Button, MultiAddSelect, Stack } from "carbon-components-svelte";
  import type { AddSelectItem } from "carbon-components-svelte/AddSelect/AddSelect.svelte";

  const people: AddSelectItem[] = [
    { id: "eng", title: "Engineering", hasChildren: true, childCount: 3 },
    { id: "design", title: "Design", hasChildren: true, childCount: 2 },
    ...[
      ["eng", "Alice Nakamura", "Staff engineer"],
      ["eng", "Amir Haddad", "Engineering manager"],
      ["eng", "Chen Wei", "Site reliability engineer"],
      ["design", "Dalia Ibrahim", "Principal designer"],
      ["design", "Emeka Eze", "Design technologist"],
    ].map(([parentId, name, role]): AddSelectItem => ({
      id: name.toLowerCase().replace(" ", "."),
      title: name,
      description: role,
      parentId,
      avatar: { name },
      meta: [parentId === "eng" ? "Engineering" : "Design"],
    })),
  ];

  // The initial value holds a key whose item is not in the first page.
  let value: (string | number)[] = ["chen.wei"];
  let selectedItems: AddSelectItem[] = [];

  function resolveItems(keys: (string | number)[]) {
    return Promise.resolve(people.filter((person) => keys.includes(person.id)));
  }
</script>

<Stack gap={5}>
  <MultiAddSelect
    bind:value
    bind:selectedItems
    items={people}
    {resolveItems}
    labelText="People"
    rootText="Teams"
    selectedLabelText="Members"
    confirmCountText={(count) => `Add ${count} members`}
  >
    <svelte:fragment slot="details" let:item>
      <p>{item.title}</p>
      <p>{item.description}</p>
    </svelte:fragment>
  </MultiAddSelect>
  <Button kind="tertiary" on:click={() => (value = [])}
    >Remove all members</Button
  >
</Stack>
