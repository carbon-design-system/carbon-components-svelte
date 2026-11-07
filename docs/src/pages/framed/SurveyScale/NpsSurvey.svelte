<script>
  import {
    Button,
    Form,
    InlineNotification,
    Stack,
    SurveyScale,
    TextArea,
  } from "carbon-components-svelte";

  let score;
  let comment = "";
  let submitted = false;
  let invalid = false;

  // Detractors (0 to 6), passives (7 and 8) and promoters (9 and 10) get
  // a different follow-up question.
  $: followUp =
    score === undefined
      ? ""
      : score <= 6
        ? "What went wrong?"
        : score <= 8
          ? "What would make it a 10?"
          : "What do you like most?";

  function handleSubmit(event) {
    event.preventDefault();
    invalid = score === undefined;
    submitted = !invalid;
  }
</script>

{#if submitted}
  <InlineNotification
    kind="success"
    hideCloseButton
    lowContrast
    title="Thanks for your feedback."
    subtitle="You gave us {score} out of 10."
  />
{:else}
  <Form on:submit={handleSubmit} novalidate>
    <Stack gap={6}>
      <SurveyScale
        preset="nps"
        name="nps"
        legendText="How likely are you to recommend Acme Billing to a colleague?"
        required
        {invalid}
        invalidText="Choose a score from 0 to 10."
        bind:value={score}
        on:change={() => (invalid = false)}
      />
      {#if followUp}
        <TextArea labelText={followUp} name="comment" bind:value={comment} />
      {/if}
      <Button type="submit">Send feedback</Button>
    </Stack>
  </Form>
{/if}
