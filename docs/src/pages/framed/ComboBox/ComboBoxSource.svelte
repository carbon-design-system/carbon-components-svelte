<script>
  import { ComboBox, createAsyncSource } from "carbon-components-svelte";

  const directory = [
    "Alice Nakamura",
    "Alan Okafor",
    "Amir Haddad",
    "Beatriz Souza",
    "Chen Wei",
    "Dalia Ibrahim",
    "Emeka Eze",
    "Farah Qureshi",
    "Gustavo Silva",
    "Hana Kobayashi",
  ];

  // Simulate a request to a directory service.
  const people = createAsyncSource(
    async (query, { signal }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      signal.throwIfAborted();
      return directory
        .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
        .map((name) => ({ id: name, text: name }));
    },
    { debounce: 200, minLength: 2 },
  );
</script>

<ComboBox
  labelText="Assignee"
  placeholder="Type two letters to search"
  source={people}
  loadingDelay={300}
  items={[]}
/>
