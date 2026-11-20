<script lang="ts">
  import PeoplePicker from "carbon-components-svelte/PeoplePicker/PeoplePicker.svelte";

  const value = [
    { id: 1, name: "Ada Lovelace", email: "ada@x.com" },
    { id: "g1", name: "Design", type: "group" as const },
    { id: "bad", name: "bad", free: true, invalid: true },
    { id: 4, name: "Four" },
  ];
</script>

<PeoplePicker
  id="people"
  labelText="People"
  name="people"
  maxVisible={3}
  {value}
/>
