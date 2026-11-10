---
components: ["SurveyScale"]
description: Survey scales ask one rating question, such as NPS, CSAT or a Likert statement, as a group of radio options with labeled ends.
keywords: ["nps", "csat", "likert", "survey", "feedback", "rating", "net promoter score", "semantic differential"]
---

<script>
  import { SurveyScale, Stack } from "carbon-components-svelte";
</script>

## Basic

A survey scale is a radio group: a `fieldset` named by the legend, with one native radio for each point. Arrow keys move the answer and <DocKbd label="Tab" /> moves on to the next question. `value` is `undefined` until the question is answered, so a `0` is an answer.

<SurveyScale legendText="The new dashboard is easy to use." />

## Presets

Set `preset` to start from a common scale. Each preset names its options, so a screen reader announces "Strongly agree", not just "5".

### NPS

`"nps"` runs from 0 to 10 with "Not at all likely" and "Extremely likely" at the ends. Set `minLabel` and `maxLabel` to change them. On a narrow container the eleven options wrap onto two rows of 44px targets, with the low end above the options and the high end below.

<SurveyScale preset="nps" legendText="How likely are you to recommend Acme Billing to a colleague?" />

### CSAT

`"csat"` runs from 1 to 5 and draws a face for each point. The options are still named "Very dissatisfied" to "Very satisfied". For stars, use [StarRating](/components/StarRating).

<SurveyScale preset="csat" legendText="How satisfied are you with the support you received?" />

### Likert

`"likert"` is the default. Set `levels` to `7` for the longer scale. Labeled options sit in a row while the container is wide enough, and stack into a list when it isn't.

<SurveyScale levels={7} legendText="The documentation answered my question." />

## Display

Set `display` to choose what each option draws: `"number"`, `"label"` or `"icon"`. A numeric option keeps its label in its accessible name ("4 Satisfied"), and the first and last labels show at the ends.

<Stack gap={7}>
  <SurveyScale preset="csat" display="number" legendText="How satisfied are you with the delivery?" />
  <SurveyScale preset="csat" display="label" legendText="How satisfied are you with the packaging?" />
</Stack>

## Custom points

Set `points` to use your own scale, lowest first. A point takes a `value` (a number or a string), optional `text` to draw, a `label` for screen readers, and an `icon` component for `display="icon"`. Use `minLabel` and `maxLabel` for the two poles of a semantic differential.

<Stack gap={7}>
  <SurveyScale
    points={[1, 2, 3, 4, 5, 6, 7].map((value) => ({ value }))}
    minLabel="Difficult"
    maxLabel="Easy"
    legendText="Setting up your workspace was"
  />
  <SurveyScale
    display="label"
    points={[
      { value: "yes", label: "Yes" },
      { value: "unsure", label: "Not sure" },
      { value: "no", label: "No" },
    ]}
    legendText="Did the export include every project?"
  />
</Stack>

## Translated labels

Set `labels` to replace the preset's labels, lowest first, and `scaleText` to word the sentence that describes the ends. A missing entry keeps its default.

<SurveyScale
  levels={5}
  labels={["Muy en desacuerdo", "En desacuerdo", "Ni de acuerdo ni en desacuerdo", "De acuerdo", "Muy de acuerdo"]}
  legendText="La exportación fue fácil de usar."
/>

## Value

Bind `value` to read the answer, or listen for `change`. It carries the point's `value` as it was given, a number for the presets. Set `allowDeselect` so choosing the current answer clears it, and the event carries `null`.

<SurveyScale preset="nps" value={8} allowDeselect legendText="How likely are you to recommend Acme Billing to a colleague?" />

## Forms

Each option is a native radio, so the answer submits with its form under `name` and `required` blocks a submit until it is answered. A form reset clears the answer. The radios are named after `id` when you set no `name`, so two scales on a page never share an answer.

<SurveyScale name="satisfaction" required legendText="How satisfied are you with the new dashboard?" preset="csat" />

### NPS survey

Ask for the score first, then a follow-up that depends on it.

<FileSource src="/framed/SurveyScale/NpsSurvey" />

### CSAT after support

Rate a support ticket, then confirm.

<FileSource src="/framed/SurveyScale/CsatAfterSupport" />

## Helper text

Use `helperText` to add guidance below the options.

<SurveyScale preset="nps" legendText="How likely are you to recommend Acme Billing to a colleague?" helperText="Think about the last three months." />

## States

Reflect validation and interaction states.

### Invalid

<SurveyScale preset="nps" legendText="How likely are you to recommend Acme Billing to a colleague?" invalid invalidText="Choose a score from 0 to 10." />

### Warning

<SurveyScale preset="nps" value={2} legendText="How likely are you to recommend Acme Billing to a colleague?" warn warnText="A score below 7 sends your answer to our support team." />

### Disabled

<SurveyScale preset="nps" value={9} legendText="How likely are you to recommend Acme Billing to a colleague?" disabled />

### Read-only

Set `readonly` to show an answer without letting it change.

<SurveyScale preset="csat" value={4} legendText="How satisfied are you with the support you received?" readonly />

## Right to left

Numbers and labels ascend in reading order: under `dir="rtl"` the lowest point sits at the right, and the arrow keys follow it, so <DocKbd label="Left" /> moves toward the highest point in every browser. Wrap a region in [LayoutDirection](/components/LayoutDirection) to set the direction.

## Usage

| Do | Why |
| --- | --- |
| Word the legend as the question, and make it complete without the options. | The legend is the group's accessible name, read once on entering the scale. |
| Use a radio scale, not a slider, for NPS. | A slider hides its options until they are dragged to, and a 0 to 10 answer is a choice among eleven, not a position. |
| Set the same preset across a survey. | A scale that changes direction or length between questions leads to slips. |
| Keep the lowest point at the start, as in "Strongly disagree" to "Strongly agree". | The arrow keys and the layout both follow that order, in either text direction. |
| Name every option for Likert, and only the ends for NPS. | Eleven labels do not fit a row, so the ends carry the meaning and the group description repeats them for screen readers. |
| Mark a required question with `required` and show `invalidText` after a failed submit. | The browser focuses the first unanswered radio, and the message says why. |
