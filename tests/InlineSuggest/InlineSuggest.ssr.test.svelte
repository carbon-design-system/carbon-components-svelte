<script lang="ts">
  import InlineSuggest from "carbon-components-svelte/InlineSuggest/InlineSuggest.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";

  let ref: null | HTMLInputElement = null;
</script>

<TextInput bind:ref value="ada@gm" labelText="Email" />
<InlineSuggest field={ref} source={["gmail.com"]} after="@" />
