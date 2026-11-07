<script lang="ts">
  import SurveyScale from "carbon-components-svelte/SurveyScale/SurveyScale.svelte";
  import { setTranslateContext } from "carbon-components-svelte/utils/translate-context.js";

  export let translate: (id: string) => string | undefined;

  setTranslateContext(translate);
</script>

<SurveyScale preset="csat" legendText="How satisfied are you?" />
