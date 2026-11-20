<script>
  import { PeoplePicker, Tag, UserAvatar } from "carbon-components-svelte";

  const people = [
    {
      id: "u-1042",
      name: "Priya Raman",
      email: "priya.raman@example.com",
      secondary: "Platform engineering",
    },
    {
      id: "u-2290",
      name: "Marcus Oyelaran",
      email: "marcus@example.com",
      secondary: "Site reliability",
    },
    {
      id: "u-3118",
      name: "Hannah Lindqvist",
      email: "hannah@example.com",
      secondary: "Security",
    },
  ];

  // Presence comes from elsewhere, so it is kept out of the person.
  /** @type {Record<string, "online" | "away" | "offline">} */
  const presence = {
    "u-1042": "online",
    "u-2290": "away",
    "u-3118": "offline",
  };

  let value = [people[0]];
</script>

<PeoplePicker bind:value items={people} labelText="Assignees">
  <svelte:fragment slot="item" let:person>
    <UserAvatar
      size="sm"
      name={person.name}
      backgroundColor="auto"
      status={presence[String(person.id)]}
      imageDescription=""
    />
    <span class="bx--people-picker__text">
      <span class="bx--people-picker__name">{person.name}</span>
      <span class="bx--people-picker__secondary">{person.secondary}</span>
    </span>
  </svelte:fragment>
  <svelte:fragment slot="chip" let:person let:props>
    <Tag
      {...props}
      type={presence[String(person.id)] === "online" ? "green" : "gray"}
    >
      {person.name}
    </Tag>
  </svelte:fragment>
</PeoplePicker>
