<script lang="ts">
  import OnboardingChecklist from "carbon-components-svelte/OnboardingChecklist/OnboardingChecklist.svelte";
  import type { ComponentProps } from "svelte";

  export let tasks: ComponentProps<OnboardingChecklist>["tasks"] = [];
  export let store: ComponentProps<OnboardingChecklist>["store"] = undefined;
  export let id: ComponentProps<OnboardingChecklist>["id"] = "setup";
  export let floating = false;
  export let collapsed = false;
  export let headingLevel: ComponentProps<OnboardingChecklist>["headingLevel"] =
    undefined;
  export let events: string[] = [];

  function log(event: CustomEvent) {
    events = [...events, event.type];
  }
</script>

<button type="button">Before</button>
<OnboardingChecklist
  {id}
  title="Getting started"
  {tasks}
  {store}
  {floating}
  {headingLevel}
  bind:collapsed
  data-testid="checklist"
  on:check={log}
  on:skip={log}
  on:unskip={log}
  on:action={log}
  on:complete={log}
  on:dismiss={log}
/>
<button type="button">After</button>
<span data-testid="collapsed">{collapsed}</span>
<span data-testid="events">{events.join(",")}</span>
