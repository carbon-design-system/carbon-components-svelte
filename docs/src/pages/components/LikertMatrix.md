---
components: ["LikertMatrix"]
description: Likert matrices ask several statements on the same scale, as a table of radios that stacks into one card per statement in a narrow container.
keywords: ["likert", "matrix", "grid", "survey", "questionnaire", "agreement", "rating"]
---

<script>
  import { LikertMatrix, Stack } from "carbon-components-svelte";

  const statements = [
    { id: "signup", text: "Creating my account was quick." },
    { id: "invite", text: "Inviting my team was easy." },
    { id: "import", text: "Importing my data worked the first time." },
  ];
</script>

## Basic

Each statement is a row and each point of the scale a column. A row is one native radio group, so arrow keys move the answer within a row and <DocKbd label="Tab" /> moves to the next statement. A screen reader names each radio by its statement and column, such as "Inviting my team was easy. Agree".

<LikertMatrix legendText="How much do you agree with each statement about setting up?" {statements} />

## Scale

Set `levels` to `7` for the longer Likert scale, or `preset` to `"csat"` for satisfaction. Use `labels` to replace the headings, such as for another language, or `points` for your own scale.

<Stack gap={7}>
  <LikertMatrix levels={7} legendText="Rate your first week." {statements} />
  <LikertMatrix
    preset="csat"
    legendText="How satisfied were you with each step?"
    statements={[
      { id: "plan", text: "Choosing a plan" },
      { id: "pay", text: "Entering payment details" },
    ]}
  />
</Stack>

## Value

Bind `value` to read the answers as a record keyed by statement `id`. A statement with no answer has no key. The `change` event carries the statement and the value just chosen.

<FileSource src="/framed/LikertMatrix/OnboardingSurvey" />

## Forms

Each row submits under its own name, `name` and the statement `id` joined with a hyphen, or the statement's own `name`. Set `required` to block a submit until every statement is answered. A form reset clears the answers.

<LikertMatrix
  legendText="How much do you agree with each statement about setting up?"
  name="onboarding"
  required
  {statements}
/>

## Narrow containers

The matrix measures its own container, not the window. While the statements column and a 72px column for each point fit, it is a table with the headings above the radios. Below that, each statement becomes a card with its own labeled options, so a 7-point matrix of ten statements stays usable on a phone. In a card the headings no longer show, but each radio keeps its column in its name.

## Helper text

<LikertMatrix legendText="How much do you agree with each statement about setting up?" helperText="Skip nothing: every statement needs an answer." {statements} />

## States

Reflect validation and interaction states.

### Invalid

Set `invalid` and `invalidText` for the matrix. Mark each unanswered statement with `invalid: true` to flag its row.

<LikertMatrix
  legendText="How much do you agree with each statement about setting up?"
  invalid
  invalidText="Answer every statement."
  value={{ signup: 4 }}
  statements={[
    { id: "signup", text: "Creating my account was quick." },
    { id: "invite", text: "Inviting my team was easy.", invalid: true },
  ]}
/>

### Warning

<LikertMatrix
  legendText="How much do you agree with each statement about setting up?"
  warn
  warnText="Most of your answers are below Neutral."
  value={{ signup: 1, invite: 2, import: 2 }}
  {statements}
/>

### Disabled

<LikertMatrix legendText="How much do you agree with each statement about setting up?" disabled value={{ signup: 5 }} {statements} />

### Read-only

<LikertMatrix legendText="How much do you agree with each statement about setting up?" readonly value={{ signup: 4, invite: 5, import: 2 }} {statements} />

## Right to left

Columns follow the reading direction: under `dir="rtl"` the lowest point is the first column at the right, and the arrow keys follow it in every browser.

## Usage

| Do | Why |
| --- | --- |
| Use a matrix only when the statements share one scale and one subject. | A table of radios is hard to scan once the columns mean different things. |
| Keep the list to about ten statements. | A long matrix reads as a chore and invites the same answer down a column. |
| Write each statement so it makes sense with every column heading. | The heading is the only label above a radio. |
| Pass a `legendText` that says what the statements are about. | It names the group; each radio is then named by its statement and column. |
| Flag unanswered rows with `invalid: true` after a failed submit. | The message says what is missing, and the row marker shows where. |
| Use a single [SurveyScale](/components/SurveyScale) when you ask one question. | It has end labels and presets for NPS and CSAT that a matrix does not need. |
