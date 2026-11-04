<script>
  import { TokenSearch } from "carbon-components-svelte";

  const directory = [
    {
      value: "praman",
      label: "Priya Raman",
      description: "Platform engineering",
    },
    {
      value: "moyelaran",
      label: "Marcus Oyelaran",
      description: "Site reliability",
    },
    { value: "hlindqvist", label: "Hannah Lindqvist", description: "Security" },
    { value: "therrera", label: "Tomás Herrera", description: "Data platform" },
    {
      value: "wzhang",
      label: "Wei Zhang",
      description: "Platform engineering",
    },
  ];

  // For demo purposes only: swap the body for a real `fetch(url, { signal })`.
  // The signal aborts when a newer query replaces this one, so a slow answer
  // never reaches the menu.
  function searchPeople(query, { signal }) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const q = query.toLowerCase();
        resolve(
          directory.filter(
            (person) =>
              person.value.includes(q) ||
              person.label.toLowerCase().includes(q),
          ),
        );
      }, 600);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }

  const keys = [
    {
      key: "author",
      label: "Author",
      type: "user",
      // Known at once, and shown while the source answers.
      values: [{ value: "@me", label: "Me" }],
      source: searchPeople,
    },
    {
      key: "assignee",
      label: "Assignee",
      type: "user",
      values: [{ value: "@me", label: "Me" }],
      source: searchPeople,
    },
  ];

  let value = "author:";
</script>

<TokenSearch
  bind:value
  {keys}
  labelText="Search issues"
  helperText="Results load from a simulated directory service"
  debounce={200}
  loadingDelay={150}
/>
