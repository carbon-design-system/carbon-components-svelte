<script lang="ts">
  import { getContext } from "svelte";
  import type { Readable } from "svelte/store";

  const ctx = getContext<{
    activeCommands: Readable<Set<string>>;
    disabled: Readable<boolean>;
    dispatch: (command: { command: string; value?: unknown }) => void;
    setValue: (html: string) => void;
  }>("carbon:RichTextEditor");

  const { activeCommands, disabled, dispatch, setValue } = ctx;
</script>

<button type="button" data-testid="set" on:click={() => setValue("<p>hi</p>")}>
  set
</button>
<button
  type="button"
  data-testid="dispatch"
  on:click={() => dispatch({ command: "bold" })}
>
  dispatch
</button>
<span data-testid="disabled">{$disabled}</span>
<span data-testid="active">{[...$activeCommands].join(",")}</span>
