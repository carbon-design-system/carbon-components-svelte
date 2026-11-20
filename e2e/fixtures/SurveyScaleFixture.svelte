<script lang="ts">
  import { SurveyScale } from "carbon-components-svelte";

  let nps: number | undefined;
  let likert: number | undefined = 4;
  let changes = 0;
</script>

<form data-testid="form">
  <div data-testid="nps">
    <SurveyScale
      preset="nps"
      name="nps"
      legendText="How likely are you to recommend us to a friend?"
      bind:value={nps}
      on:change={() => (changes += 1)}
    />
  </div>

  <div data-testid="csat">
    <SurveyScale
      preset="csat"
      name="csat"
      legendText="How satisfied are you with the support you received?"
    />
  </div>

  <div data-testid="csat-number">
    <SurveyScale
      preset="csat"
      display="number"
      legendText="How satisfied are you with the delivery?"
    />
  </div>

  <div data-testid="likert">
    <SurveyScale
      legendText="The checkout was easy to use."
      bind:value={likert}
    />
  </div>

  <div data-testid="likert7">
    <SurveyScale
      preset="likert"
      levels={7}
      legendText="The documentation answered my question."
    />
  </div>

  <div data-testid="differential">
    <SurveyScale
      points={[1, 2, 3, 4, 5, 6, 7].map((value) => ({ value }))}
      minLabel="Difficult"
      maxLabel="Easy"
      legendText="Setting up was"
    />
  </div>

  <div data-testid="invalid">
    <SurveyScale
      preset="nps"
      legendText="Required question"
      invalid
      invalidText="Choose a score"
    />
  </div>

  <div data-testid="warn">
    <SurveyScale
      preset="nps"
      value={2}
      legendText="Warning question"
      warn
      warnText="Low scores ask for a comment"
    />
  </div>

  <div data-testid="disabled">
    <SurveyScale preset="nps" value={7} legendText="Disabled" disabled />
  </div>

  <div data-testid="helper">
    <SurveyScale
      preset="csat"
      display="label"
      legendText="With helper text"
      helperText="Think about your last order"
    />
  </div>

  <button type="reset" data-testid="reset">Reset</button>
</form>

<!-- Outside the form: a form reset also resets its `<output>` elements. -->
<output data-testid="nps-value">{nps ?? "none"}</output>
<output data-testid="changes">{changes}</output>
