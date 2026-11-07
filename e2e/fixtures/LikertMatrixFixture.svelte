<script lang="ts">
  import { LikertMatrix } from "carbon-components-svelte";

  const onboarding = [
    { id: "signup", text: "Creating my account was quick." },
    { id: "invite", text: "Inviting my team was easy." },
    { id: "import", text: "Importing my data worked the first time." },
  ];

  const ten = Array.from({ length: 10 }, (_, index) => ({
    id: `s${index}`,
    text: [
      "The setup guide was clear.",
      "I found the billing page without help.",
      "Role permissions were easy to understand.",
      "The import preview matched my file.",
      "Error messages told me what to do next.",
      "The search results were relevant.",
      "I could undo a mistake.",
      "Notifications were not too frequent.",
      "The mobile layout was usable.",
      "Support answered in a reasonable time.",
    ][index],
  }));

  let answers: Record<string, string | number> = {};
  let changes = 0;
</script>

<form data-testid="form">
  <div data-testid="onboarding">
    <LikertMatrix
      legendText="How much do you agree with each statement about setting up?"
      statements={onboarding}
      name="onboarding"
      bind:value={answers}
      on:change={() => (changes += 1)}
    />
  </div>

  <div data-testid="stress">
    <LikertMatrix
      levels={7}
      legendText="Rate your first week"
      statements={ten}
    />
  </div>

  <div data-testid="invalid">
    <LikertMatrix
      legendText="Required matrix"
      statements={[
        { id: "a", text: "Statement answered." },
        { id: "b", text: "Statement missing.", invalid: true },
      ]}
      value={{ a: 4 }}
      invalid
      invalidText="Answer every statement."
    />
  </div>

  <div data-testid="disabled">
    <LikertMatrix
      legendText="Disabled matrix"
      statements={onboarding}
      value={{ signup: 5 }}
      disabled
    />
  </div>

  <button type="reset" data-testid="reset">Reset</button>
</form>

<!-- Outside the form: a form reset also resets its `<output>` elements. -->
<output data-testid="answers">{JSON.stringify(answers)}</output>
<output data-testid="changes">{changes}</output>
