<script lang="ts">
  import type { CopyActionState } from "carbon-components-svelte/CopyButton/copy";
  import { copy } from "carbon-components-svelte/CopyButton/copy";

  export let text: string | undefined = "https://api.acme.io/v1";
  export let getText: (() => string | Promise<string>) | undefined = undefined;
  export let copyOverride:
    | ((text: string) => void | Promise<void>)
    | undefined = undefined;
  export let onCopy: ((text: string) => void) | undefined = undefined;
  export let onError: ((error: unknown) => void) | undefined = undefined;
  export let onStateChange: ((state: CopyActionState) => void) | undefined =
    undefined;
  export let feedbackTimeout = 2000;
  export let enabled = true;
</script>

<button
  type="button"
  use:copy={{
    text,
    getText,
    copy: copyOverride,
    onCopy,
    onError,
    onStateChange,
    feedbackTimeout,
    enabled,
  }}
>
  Copy endpoint
</button>
