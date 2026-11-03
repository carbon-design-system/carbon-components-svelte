<script>
  import { Mentions, TextArea } from "carbon-components-svelte";

  let ref = null;
  let value = "";

  const directory = [
    { id: "u-1042", text: "Priya Raman", secondary: "Platform engineering" },
    { id: "u-2290", text: "Marcus Oyelaran", secondary: "Site reliability" },
    { id: "u-3118", text: "Hannah Lindqvist", secondary: "Security" },
    { id: "u-4501", text: "Tomás Herrera", secondary: "Data platform" },
    { id: "u-5873", text: "Wei Zhang", secondary: "Platform engineering" },
  ];

  // For demo purposes only: swap the body for a real `fetch(url, { signal })`.
  // The signal aborts when a newer query replaces this one, so a slow answer
  // never reaches the menu.
  function search(query, { signal }) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const q = query.toLowerCase();
        resolve(
          directory.filter(
            (person) =>
              person.text.toLowerCase().includes(q) ||
              person.secondary.toLowerCase().includes(q),
          ),
        );
      }, 700);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }
</script>

<TextArea
  bind:ref
  bind:value
  labelText="Comment"
  helperText="Results load from a simulated directory service"
/>
<Mentions
  field={ref}
  triggers={[{ char: "@", items: search, debounce: 200, label: "Directory" }]}
  loadingDelay={150}
/>
