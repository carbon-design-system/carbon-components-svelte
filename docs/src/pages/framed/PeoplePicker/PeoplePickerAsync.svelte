<script>
  import { PeoplePicker, Stack, Toggle } from "carbon-components-svelte";

  const directory = [
    { id: "u-1042", name: "Priya Raman", email: "priya.raman@example.com" },
    { id: "u-2290", name: "Marcus Oyelaran", email: "marcus@example.com" },
    { id: "u-3118", name: "Hannah Lindqvist", email: "hannah@example.com" },
    { id: "u-4501", name: "Tomás Herrera", email: "tomas@example.com" },
    { id: "u-5873", name: "Wei Zhang", email: "wei.zhang@example.com" },
  ];

  let offline = false;
  let value = [];

  // For demo purposes only: swap the body for a real `fetch(url, { signal })`.
  // The signal aborts when a newer query replaces this one, so a slow answer
  // never reaches the menu.
  function search(query, { signal }) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (offline) {
          reject(new Error("Directory unavailable"));
          return;
        }
        const q = query.toLowerCase();
        resolve(
          directory.filter(
            (person) =>
              person.name.toLowerCase().includes(q) || person.email.includes(q),
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

<Stack gap={5}>
  <PeoplePicker
    bind:value
    items={search}
    minQueryLength={1}
    loadingDelay={150}
    labelText="Reviewers"
    helperText="Results load from a simulated directory service"
  />
  <Toggle
    bind:toggled={offline}
    labelText="Directory service"
    labelA="Online"
    labelB="Offline"
  />
</Stack>
