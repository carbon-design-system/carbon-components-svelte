<script lang="ts">
  import PromptInput from "carbon-components-svelte/PromptInput/PromptInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "";
  export let attachments: ComponentProps<PromptInput>["attachments"] = [];
  export let history: string[] = [];
  export let status: "ready" | "submitted" | "streaming" = "ready";
  export let submitOn: "enter" | "mod-enter" = "enter";
  export let disabled = false;
  export let maxCount: number | undefined = undefined;
  export let hint: ComponentProps<PromptInput>["hint"] = undefined;
  export let accept = "";
  export let maxFiles = 10;
  export let maxFileSize: number | undefined = undefined;
  export let attachable = true;

  let log: string[] = [];
  const record = (line: string) => (log = [...log, line]);
</script>

<PromptInput
  data-testid="field"
  bind:value
  bind:attachments
  bind:history
  {status}
  {submitOn}
  {disabled}
  {maxCount}
  {hint}
  {accept}
  {maxFiles}
  {maxFileSize}
  {attachable}
  on:submit={(event) =>
    record(
      `submit ${JSON.stringify(event.detail.text)} [${event.detail.attachments.map((a) => a.name)}]`,
    )}
  on:stop={() => record("stop")}
  on:attach={(event) =>
    record(`attach ${event.detail.items.map((a) => a.name)}`)}
  on:remove={(event) => record(`remove ${event.detail.attachment.name}`)}
  on:reject={(event) =>
    record(`reject ${event.detail.file.name} ${event.detail.reason}`)}
>
  <button slot="tools" type="button">Model</button>
</PromptInput>
<output data-testid="log">{log.join("\n")}</output>
<output data-testid="value">{value}</output>
