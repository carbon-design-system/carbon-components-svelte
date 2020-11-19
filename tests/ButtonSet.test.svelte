<script lang="ts">
  import { Button, ButtonSet } from "../types";
  import Login16 from "carbon-icons-svelte/lib/Login16";
</script>

<ButtonSet>
  <Button kind="secondary">Cancel</Button>
  <Button>Submit</Button>
</ButtonSet>

<ButtonSet stacked>
  <Button icon="{Login16}">Log in</Button>
  <Button kind="ghost">Sign up</Button>
</ButtonSet>
