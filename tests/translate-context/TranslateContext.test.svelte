<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
  import { setTranslateContext } from "carbon-components-svelte/utils/translate-context.js";

  export let translate: ((id: string) => string | undefined) | undefined =
    undefined;
  export let numberInputProp: ((id: string) => string) | undefined = undefined;
  export let dropdownProp: ((id: string) => string) | undefined = undefined;

  if (translate) setTranslateContext(translate);
</script>

<NumberInput translateWithId={numberInputProp} />
<Dropdown
  items={[{ id: "a", text: "A" }]}
  selectedId="a"
  clearable
  translateWithIdSelection={dropdownProp}
/>
