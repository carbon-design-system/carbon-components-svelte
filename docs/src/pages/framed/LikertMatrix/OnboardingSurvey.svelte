<script>
  import {
    Button,
    Form,
    InlineNotification,
    LikertMatrix,
    Stack,
  } from "carbon-components-svelte";

  const statements = [
    { id: "signup", text: "Creating my account was quick." },
    { id: "invite", text: "Inviting my team was easy." },
    { id: "import", text: "Importing my data worked the first time." },
    { id: "billing", text: "I found the billing settings without help." },
  ];

  let answers = {};
  let submitted = false;
  let invalid = false;

  $: missing = statements.filter(
    (statement) => answers[statement.id] === undefined,
  );
  $: rows = statements.map((statement) => ({
    ...statement,
    invalid: invalid && answers[statement.id] === undefined,
  }));

  function handleSubmit(event) {
    event.preventDefault();
    invalid = missing.length > 0;
    submitted = !invalid;
  }
</script>

{#if submitted}
  <InlineNotification
    kind="success"
    hideCloseButton
    lowContrast
    title="Thanks for the feedback."
    subtitle="You rated {statements.length} statements."
  />
{:else}
  <Form on:submit={handleSubmit} novalidate>
    <Stack gap={6}>
      <LikertMatrix
        legendText="How much do you agree with each statement about setting up?"
        statements={rows}
        name="onboarding"
        required
        {invalid}
        invalidText="Answer {missing.length} more {missing.length === 1
          ? 'statement'
          : 'statements'}."
        bind:value={answers}
      />
      <Button type="submit">Send feedback</Button>
    </Stack>
  </Form>
{/if}
