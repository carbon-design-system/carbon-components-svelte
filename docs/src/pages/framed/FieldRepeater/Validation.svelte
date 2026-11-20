<script>
  import {
    Button,
    FieldRepeater,
    Link,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  const EMAIL = /^[^@\s]+@[^@\s]+$/;

  let emails = ["ada@example.com", "grace", ""];
  let repeater;
  let submitted = false;

  function check(email) {
    if (!email) return "Enter an email address";
    return EMAIL.test(email) ? "" : "Enter an email like name@example.com";
  }

  $: errors = emails
    .map((email, index) => ({ index, text: check(email) }))
    .filter((error) => error.text);
</script>

<form novalidate on:submit|preventDefault={() => (submitted = true)}>
  <Stack gap={6}>
    {#if submitted && errors.length}
      <ul>
        {#each errors as error}
          <li>
            <Link
              href="#emails-{error.index}-email"
              on:click={(event) => {
                event.preventDefault();
                repeater.focusItem(error.index);
              }}>Email {error.index + 1}: {error.text}</Link
            >
          </li>
        {/each}
      </ul>
    {/if}
    <FieldRepeater
      bind:this={repeater}
      bind:items={emails}
      id="emails"
      itemName="email"
      legendText="Notification emails"
      min={1}
      hideItemLabel
      let:index
      let:id
      let:label
    >
      <TextInput
        id="{id}-email"
        labelText={label}
        type="email"
        bind:value={emails[index]}
        invalid={submitted && Boolean(check(emails[index]))}
        invalidText={check(emails[index])}
      />
    </FieldRepeater>
    <div>
      <Button type="submit">Save</Button>
    </div>
  </Stack>
</form>
