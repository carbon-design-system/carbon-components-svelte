<script>
  import {
    Button,
    downloadFile,
    ImportWizard,
    Stack,
  } from "carbon-components-svelte";

  // `const` keeps each `type` a literal for the type check.
  const fields = /** @type {const} */ ([
    {
      key: "name",
      label: "Full name",
      required: true,
      aliases: ["customer", "contact"],
    },
    {
      key: "email",
      label: "Email",
      type: "email",
      required: true,
      aliases: ["mail"],
    },
    {
      key: "role",
      label: "Role",
      type: "enum",
      options: [
        { value: "admin", label: "Administrator", aliases: ["owner"] },
        { value: "editor", label: "Editor" },
        { value: "viewer", label: "Viewer", aliases: ["read only"] },
      ],
    },
    { key: "active", label: "Active", type: "boolean" },
    {
      key: "joined",
      label: "Joined",
      type: "date",
      dateFormats: ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"],
    },
    { key: "seats", label: "Seats", type: "integer", min: 1, max: 500 },
  ]);

  // For demo purposes only: stands in for the request that creates the users.
  async function onImport(users, { signal }) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    signal.throwIfAborted();
    const taken = users.findIndex((user) => user.email.startsWith("grace@"));
    return taken === -1
      ? undefined
      : { errors: [{ index: taken, message: "That email has an account." }] };
  }

  function downloadSample() {
    const rows = ["Customer,Mail,Role,Active,Joined,Seats"];
    const names = [
      "Ada Lovelace",
      "Grace Hopper",
      "Alan Turing",
      "Edsger Dijkstra",
      "Barbara Liskov",
    ];
    const roles = ["Owner", "editor", "Read only", "viewer", "contractor"];
    for (let i = 0; i < 40; i++) {
      const name = `${names[i % names.length]} ${Math.floor(i / names.length) + 1}`;
      const email = `${name.split(" ")[0].toLowerCase()}${i}@example.com`;
      rows.push(
        [
          name,
          i % 9 === 4 ? email.replace("@", "") : email,
          roles[i % roles.length],
          i % 3 === 0 ? "N" : "Y",
          `${(i % 12) + 1}/${(i % 27) + 1}/2024`,
          i % 11 === 6 ? "many" : (i % 40) + 1,
        ].join(","),
      );
    }
    rows.push("Ada Lovelace 1,ada0@example.com,admin,Y,3/4/2024,2");
    downloadFile(rows.join("\n"), "users-sample.csv", "text/csv");
  }
</script>

<Stack gap={6}>
  <div>
    <Button kind="tertiary" size="small" on:click={downloadSample}>
      Download a sample file
    </Button>
  </div>
  <ImportWizard {fields} {onImport} keyField="email" />
</Stack>
