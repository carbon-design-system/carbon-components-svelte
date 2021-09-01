<script>
  import { Button } from "../../src";

  let count = 0;
</script>

<Button on:click="{() => count++}">Click me: {count}</Button>
