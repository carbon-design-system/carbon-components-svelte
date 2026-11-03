<script>
  import { PeoplePicker, Stack } from "carbon-components-svelte";

  const mei = { id: "u-1", name: "Mei Chen", email: "mei@example.com" };
  const zoe = { id: "u-2", name: "Zoë Allen", email: "zoe@example.com" };
  const sam = { id: "u-3", name: "Sam Patel", email: "sam@example.com" };

  const everyone = [
    {
      id: "g-design",
      type: /** @type {"group"} */ ("group"),
      name: "Design",
      memberCount: 2,
      members: [mei, zoe],
    },
    {
      id: "g-platform",
      type: /** @type {"group"} */ ("group"),
      name: "Platform",
      memberCount: 1,
    },
    mei,
    zoe,
    sam,
  ];

  // For demo purposes only: a real app would ask its directory.
  function loadMembers(group, { signal }) {
    const members = group.id === "g-platform" ? [sam] : [];
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(members), 400);
      signal.addEventListener("abort", () => clearTimeout(timer));
    });
  }

  let shared = [];
  let invited = [];
</script>

<Stack gap={7}>
  <PeoplePicker
    bind:value={shared}
    items={everyone}
    labelText="Share with (a group stays one chip)"
    helperText="The group keeps following its membership"
  />
  <PeoplePicker
    bind:value={invited}
    items={everyone}
    groups="expand"
    {loadMembers}
    labelText="Invite (a group adds its members)"
    helperText="Platform has no member list, so its members load first"
  />
</Stack>
