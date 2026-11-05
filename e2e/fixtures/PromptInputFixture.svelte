<script lang="ts">
  import { Button, PromptInput } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  let value = "";
  let status: "ready" | "submitted" | "streaming" = "ready";
  let attachments: ComponentProps<PromptInput>["attachments"] = [];
  let history = ["Summarize the incident report", "Draft a status page update"];
  let log: string[] = [];
  let submitOn: "enter" | "mod-enter" = "enter";
  let disabled = false;

  const record = (line: string) => (log = [...log, line]);
</script>

<div style="max-width: 560px">
  <PromptInput
    data-testid="composer"
    placeholder="Ask about your deployments"
    maxCount={200}
    {submitOn}
    {disabled}
    {status}
    bind:value
    bind:attachments
    bind:history
    on:submit={(e) =>
      record(
        `submit:${e.detail.text}:${e.detail.attachments.map((a) => a.name).join(",")}`,
      )}
    on:stop={() => {
      record("stop");
      status = "ready";
    }}
    on:attach={(e) => record(`attach:${e.detail.items.map((a) => a.name)}`)}
    on:remove={(e) => record(`remove:${e.detail.attachment.name}`)}
    on:reject={(e) => record(`reject:${e.detail.file.name}:${e.detail.reason}`)}
    accept="image/*,.pdf,.txt"
    maxFiles={3}
  >
    <Button slot="tools" kind="ghost" size="sm">Model: Granite 4</Button>
  </PromptInput>
  <button
    type="button"
    data-testid="stream"
    on:click={() => (status = "streaming")}>stream</button
  >
  <button
    type="button"
    data-testid="wait"
    on:click={() => (status = "submitted")}>wait</button
  >
  <button
    type="button"
    data-testid="mod"
    on:click={() => (submitOn = "mod-enter")}>mod</button
  >
  <button type="button" data-testid="disable" on:click={() => (disabled = true)}
    >disable</button
  >
  <pre data-testid="log">{log.join("\n")}</pre>
  <output data-testid="value">{value}</output>
</div>
