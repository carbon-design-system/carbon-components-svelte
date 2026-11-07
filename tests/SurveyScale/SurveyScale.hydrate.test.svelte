<script lang="ts">
  import SurveyScale from "carbon-components-svelte/SurveyScale/SurveyScale.svelte";
  import { createIdScope } from "carbon-components-svelte/utils/id-scope.js";

  createIdScope("app");
</script>

<SurveyScale
  preset="nps"
  value={0}
  legendText="How likely are you to recommend us?"
/>
<SurveyScale preset="csat" legendText="How satisfied are you?" />
