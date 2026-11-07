<script lang="ts">
  import Box from "carbon-components-svelte/Box/Box.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import FieldRepeater from "carbon-components-svelte/FieldRepeater/FieldRepeater.svelte";
  import Link from "carbon-components-svelte/Link/Link.svelte";
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
  import Stack from "carbon-components-svelte/Stack/Stack.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";

  const params = new URLSearchParams(location.search);
  const many = Number(params.get("many") ?? 0);
  const filled = params.has("errors");

  let emails = many
    ? Array.from({ length: many }, (_, i) => `person${i + 1}@example.com`)
    : filled
      ? ["ada@example.com", "grace", ""]
      : ["ada@example.com"];
  let team = [
    { name: "Ada Lovelace", role: "Engineer" },
    { name: "Grace Hopper", role: "Manager" },
  ];
  let summaryEmails = ["ada@example.com", "grace@example.com"];
  let emailRepeater: FieldRepeater<string>;
  let submitted = filled;

  const EMAIL = /^[^@\s]+@[^@\s]+$/;

  function emailError(email: string) {
    if (!email) return "Enter an email address";
    return EMAIL.test(email) ? "" : "Enter an email like name@example.com";
  }

  $: errors = emails
    .map((email, index) => ({ index, text: emailError(email) }))
    .filter((error) => error.text);
</script>

<Box padding={6} maxWidth="40rem">
  <Stack gap={7}>
    {#if submitted && errors.length}
      <ul data-testid="errors">
        {#each errors as error}
          <li>
            <Link
              href="#emails-{error.index}-email"
              on:click={(event) => {
                event.preventDefault();
                emailRepeater.focusItem(error.index);
              }}>Email {error.index + 1}: {error.text}</Link
            >
          </li>
        {/each}
      </ul>
    {/if}

    <form
      data-testid="emails-form"
      novalidate
      on:submit|preventDefault={() => (submitted = true)}
    >
      <div data-testid="emails">
        <FieldRepeater
          bind:this={emailRepeater}
          bind:items={emails}
          id="emails"
          name="emails"
          itemName="email"
          legendText="Notification emails"
          helperText="We send receipts to every address."
          min={1}
          max={many ? 100 : 5}
          reorderable
          hideItemLabel
          let:index
          let:label
          let:fieldName
          let:id
        >
          <TextInput
            id="{id}-email"
            name={fieldName}
            labelText={label}
            type="email"
            bind:value={emails[index]}
            invalid={submitted && Boolean(emailError(emails[index]))}
            invalidText={emailError(emails[index])}
          />
        </FieldRepeater>
      </div>
      <Button type="submit" kind="secondary">Submit</Button>
    </form>

    <div data-testid="team">
      <FieldRepeater
        bind:items={team}
        id="team"
        name="members"
        itemName="member"
        legendText="Team members"
        createItem={() => ({ name: "", role: "Engineer" })}
        max={4}
        let:index
        let:id
        let:fieldName
      >
        <TextInput
          id="{id}-name"
          name="{fieldName}[name]"
          labelText="Name"
          bind:value={team[index].name}
        />
        <Select
          id="{id}-role"
          name="{fieldName}[role]"
          labelText="Role"
          bind:selected={team[index].role}
        >
          <SelectItem value="Engineer" text="Engineer" />
          <SelectItem value="Manager" text="Manager" />
          <SelectItem value="Designer" text="Designer" />
        </Select>
      </FieldRepeater>
    </div>

    <div data-testid="summary">
      <FieldRepeater
        bind:items={summaryEmails}
        id="summary"
        name="backup"
        itemName="backup email"
        legendText="Backup emails"
        summaryText={(email) => email || "Not entered"}
        reorderable
        let:index
        let:id
        let:fieldName
        let:label
      >
        <TextInput
          id="{id}-email"
          name={fieldName}
          labelText={label}
          hideLabel
          bind:value={summaryEmails[index]}
        />
      </FieldRepeater>
    </div>

    <div data-testid="empty">
      <FieldRepeater
        items={[]}
        id="empty"
        itemName="phone number"
        legendText="Phone numbers"
      />
    </div>

    <output data-testid="emails-value">{JSON.stringify(emails)}</output>
  </Stack>
</Box>
