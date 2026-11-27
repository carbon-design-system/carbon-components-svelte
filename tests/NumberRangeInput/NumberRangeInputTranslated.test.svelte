<script lang="ts">
  import NumberRangeInput from "carbon-components-svelte/NumberRangeInput/NumberRangeInput.svelte";
  import { setTranslateContext } from "carbon-components-svelte/utils/translate-context.js";
  import type { ComponentProps } from "svelte";

  export let translate:
    | ((id: string, params?: { limit: string }) => string | undefined)
    | undefined = undefined;
  export let translateWithId:
    ComponentProps<NumberRangeInput>["translateWithId"] | undefined = undefined;

  if (translate) setTranslateContext(translate);
</script>

<NumberRangeInput
  labelText="Price"
  min={10}
  max={100}
  {...translateWithId ? { translateWithId } : {}}
/>
