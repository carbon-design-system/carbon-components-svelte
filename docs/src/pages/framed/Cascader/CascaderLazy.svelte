<script>
  import { Cascader } from "carbon-components-svelte";

  const nodes = [
    { id: "engineering", text: "Engineering", hasChildren: true },
    { id: "sales", text: "Sales", hasChildren: true },
    { id: "legal", text: "Legal" },
  ];

  const staff = {
    engineering: ["Platform", "Mobile", "Data"],
    sales: ["EMEA", "Americas"],
  };

  let attempts = 0;

  /**
   * @param {{ id: string; text: string }} node
   * @param {{ signal: AbortSignal; path: unknown[] }} context
   */
  async function loadChildren(node, { signal, path }) {
    // For demo purposes only: simulates a network request.
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 700);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
    attempts += 1;
    if (node.id === "sales" && attempts % 2 === 1) {
      throw new Error("Could not reach the server");
    }
    const names = path.length === 1 ? staff[node.id] : ["Alex", "Sam", "Kim"];
    return names.map((name) => ({
      id: `${node.id}-${name.toLowerCase()}`,
      text: name,
      hasChildren: path.length === 1,
    }));
  }

  /**
   * @param {string} query
   */
  async function search(query) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const found = [];
    for (const [team, groups] of Object.entries(staff)) {
      const teamNode = nodes.find((node) => node.id === team);
      for (const group of groups) {
        const groupNode = { id: `${team}-${group.toLowerCase()}`, text: group };
        if (
          `${teamNode.text} ${group}`
            .toLowerCase()
            .includes(query.toLowerCase())
        ) {
          found.push([teamNode, groupNode]);
        }
      }
    }
    return found;
  }

  let value = [];
</script>

<Cascader
  labelText="Team"
  label="Choose a team"
  helperText="Each level loads when it opens. Sales fails on its first try."
  {nodes}
  {loadChildren}
  bind:value
/>
<p>Value: {JSON.stringify(value)}</p>

<Cascader
  labelText="Find a team"
  placeholder="Search teams"
  helperText="The server searches, and the levels above a result load when it is chosen."
  {nodes}
  {loadChildren}
  {search}
  filterable
/>
