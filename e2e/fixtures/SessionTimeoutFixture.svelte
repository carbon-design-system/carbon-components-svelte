<script>
  import {
    createIdleTimer,
    SessionTimeoutModal,
    Stack,
    TextInput,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  // `?timeout=ms` and `?warn=ms` set the session; `?expiresIn=ms` ends it at a
  // fixed time instead, as a token would. `?channel=name` keeps pages that
  // should not share a session apart, `?crossTab=0` turns the sharing off,
  // and `?extend=fail` makes the server refuse to extend.
  const params = new URLSearchParams(location.search);
  const number = (key, fallback) =>
    params.has(key) ? Number(params.get(key)) : fallback;

  let log = [];
  const record = (entry) => (log = [...log, entry]);

  const timer = createIdleTimer({
    timeout: params.has("expiresIn") ? undefined : number("timeout", 900000),
    warnBefore: number("warn", 120000),
    expiresAt: params.has("expiresIn")
      ? Date.now() + number("expiresIn", 0)
      : undefined,
    crossTab: params.get("crossTab") !== "0",
    channelName: params.get("channel") ?? "e2e-idle-timer",
    onWarn: () => record("warn"),
    onExpire: ({ reason, remote }) => record(`expire:${reason}:${remote}`),
    onExtend:
      params.get("extend") === "fail"
        ? () => Promise.reject(new Error("The server is down"))
        : undefined,
  });

  window.__timer = timer;
  onMount(() => () => timer.stop());
</script>

<main>
  <Stack gap={5}>
    <h1>Account</h1>
    <TextInput labelText="Display name" data-testid="name" />
    <button type="button" data-testid="page-button">Save</button>
    <p>Status: <span data-testid="status">{$timer.status}</span></p>
    <p>Log: <span data-testid="log">{log.join(",")}</span></p>
  </Stack>
</main>

<SessionTimeoutModal
  {timer}
  on:extend={() => record("extend")}
  on:signout={() => record("signout")}
  on:signin={() => record("signin")}
/>
