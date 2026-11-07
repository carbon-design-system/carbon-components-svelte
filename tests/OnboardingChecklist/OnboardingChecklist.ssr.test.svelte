<script lang="ts">
  import OnboardingChecklist from "carbon-components-svelte/OnboardingChecklist/OnboardingChecklist.svelte";
  import {
    type ChecklistSnapshot,
    createChecklistStore,
  } from "../../src/utils/checklist-store";

  export let stored: Partial<ChecklistSnapshot> = {};
  export let initial: Partial<ChecklistSnapshot> | undefined = undefined;
  export let pending: "hide" | "show" = "hide";
  export let floating = false;
  export let onRead: () => void = () => {};

  // What the user did before, read only once the page is mounted.
  const store = createChecklistStore({
    storage: {
      read: () => {
        onRead();
        return {
          done: [],
          skipped: [],
          minimized: false,
          dismissed: false,
          celebrated: false,
          ...stored,
        };
      },
      write() {},
    },
    initial,
    pending,
  });
</script>

<p>Above</p>
<OnboardingChecklist
  id="setup"
  title="Getting started"
  {store}
  {floating}
  tasks={[
    { id: "connect", title: "Connect a data source", completed: true },
    { id: "invite", title: "Invite a teammate" },
    { id: "alert", title: "Create an alert" },
  ]}
/>
<p>Below</p>
