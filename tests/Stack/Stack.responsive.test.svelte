<script lang="ts">
  import Stack from "carbon-components-svelte/Stack/Stack.svelte";
</script>

<Stack orientation={{ sm: "vertical", md: "horizontal" }}>
  <p>orientation-object</p>
</Stack>

<Stack orientation="horizontal">
  <p>orientation-scalar</p>
</Stack>

<Stack align={{ sm: "start", lg: "stretch" }}>
  <p>align-object</p>
</Stack>

<Stack align="center">
  <p>align-scalar</p>
</Stack>

<Stack align="stretch">
  <p>align-scalar-default</p>
</Stack>

<Stack wrap={{ sm: "wrap", md: "nowrap" }} orientation="horizontal">
  <p>wrap-object</p>
</Stack>

<Stack wrap="nowrap" orientation="horizontal">
  <p>wrap-scalar-default</p>
</Stack>

<Stack justify={{ sm: "start", xlg: "end" }}>
  <p>justify-object</p>
</Stack>
