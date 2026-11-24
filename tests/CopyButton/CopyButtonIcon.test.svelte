<script lang="ts">
  import CopyButton from "carbon-components-svelte/CopyButton/CopyButton.svelte";
  import TestFeedbackIcon from "./TestFeedbackIcon.test.svelte";
  import TestIcon from "./TestIcon.test.svelte";
</script>

<CopyButton
  text="https://example.com"
  icon={TestIcon}
  feedbackIcon={TestFeedbackIcon}
  iconDescription="Copy link"
  feedback="Link copied"
/>
