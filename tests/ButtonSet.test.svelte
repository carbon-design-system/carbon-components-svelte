<script lang="ts">
  import { Button, ButtonSet } from "../types";
  import Login from "carbon-icons-svelte/lib/Login.svelte";
</script>

<ButtonSet>
  <Button kind="secondary">Cancel</Button>
  <Button>Submit</Button>
</ButtonSet>

<ButtonSet stacked>
  <Button icon="{Login}">Log in</Button>
  <Button kind="ghost">Sign up</Button>
</ButtonSet>
