<script>
  import { WebTerminal } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const ESC = "\u001b";
  const green = (text) => `${ESC}[32m${text}${ESC}[39m`;
  const yellow = (text) => `${ESC}[33m${text}${ESC}[39m`;
  const red = (text) => `${ESC}[31m${text}${ESC}[39m`;
  const dim = (text) => `${ESC}[2m${text}${ESC}[22m`;
  const bold = (text) => `${ESC}[1m${text}${ESC}[22m`;

  const pods = [
    {
      name: "api-7d9f8c6b5-x2k4p",
      ready: "1/1",
      status: "Running",
      restarts: 0,
      age: "3d",
    },
    {
      name: "api-7d9f8c6b5-9tq7m",
      ready: "1/1",
      status: "Running",
      restarts: 0,
      age: "3d",
    },
    {
      name: "worker-5c6b7d4f8-lm2zd",
      ready: "0/1",
      status: "CrashLoopBackOff",
      restarts: 14,
      age: "52m",
    },
    {
      name: "cache-0",
      ready: "0/1",
      status: "Pending",
      restarts: 0,
      age: "12s",
    },
  ];

  const LEVELS = ["INFO", "INFO", "INFO", "DEBUG", "WARN"];
  const MESSAGES = [
    "GET /v1/orders 200",
    "GET /v1/orders/4121 200",
    "POST /v1/orders 201",
    "cache miss for key=session:8c1f",
    "slow query: 412ms",
  ];

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function colorStatus(status) {
    if (status === "Running") return green(status);
    if (status === "Pending") return yellow(status);
    return red(status);
  }

  function getPods() {
    const row = (name, ready, status, restarts, age, shown = status) =>
      `${name.padEnd(26)}${ready.padEnd(8)}${shown}${" ".repeat(Math.max(0, 18 - status.length))}${String(restarts).padEnd(10)}${age}`;
    return [
      bold(row("NAME", "READY", "STATUS", "RESTARTS", "AGE")),
      ...pods.map((pod) =>
        row(
          pod.name,
          pod.ready,
          pod.status,
          pod.restarts,
          pod.age,
          colorStatus(pod.status),
        ),
      ),
      "",
    ].join("\n");
  }

  async function* logs(name, follow, signal) {
    if (!pods.some((pod) => pod.name === name)) {
      throw new Error(`Error from server (NotFound): pods "${name}" not found`);
    }
    for (let i = 0; follow || i < 20; i++) {
      if (signal.aborted) return;
      const level = LEVELS[i % LEVELS.length];
      const paint =
        level === "WARN" ? yellow : level === "DEBUG" ? dim : (text) => text;
      const time = new Date(Date.now() + i * 1000).toISOString().slice(11, 23);
      yield `${dim(time)} ${paint(level.padEnd(5))} ${MESSAGES[i % MESSAGES.length]}\n`;
      // eslint-disable-next-line no-await-in-loop -- one line at a time
      await sleep(follow ? 250 : 40);
    }
  }

  async function* rollout(signal) {
    for (let step = 0; step <= 20; step++) {
      if (signal.aborted) return;
      const bar = `${"=".repeat(step)}${step < 20 ? ">" : ""}`.padEnd(20);
      yield `\r${ESC}[2KWaiting for rollout: [${bar}] ${step * 5}%`;
      // eslint-disable-next-line no-await-in-loop -- one step at a time
      await sleep(120);
    }
    yield `\n${green('deployment "api" successfully rolled out')}\n`;
  }

  function execute(command, { signal, clear }) {
    const [program, ...args] = command.trim().split(/\s+/);
    if (program === "clear") return void clear();
    if (program === "help") {
      return [
        "Commands:",
        "  kubectl get pods",
        "  kubectl logs <pod> [-f]",
        "  kubectl rollout status deploy/api",
        "  clear",
        "",
      ].join("\n");
    }
    if (program !== "kubectl") {
      throw new Error(`${program}: command not found. Try help.`);
    }
    const [verb, ...rest] = args;
    if (verb === "get" && rest[0] === "pods") return getPods();
    if (verb === "logs") {
      return logs(
        rest.find((arg) => !arg.startsWith("-")),
        rest.includes("-f"),
        signal,
      );
    }
    if (verb === "rollout" && rest[0] === "status") return rollout(signal);
    throw new Error(`error: unknown command "${args.join(" ")}"`);
  }

  const VERBS = ["get", "logs", "rollout"];

  function complete(line, cursor) {
    const words = line.slice(0, cursor).split(/\s+/);
    const current = words.at(-1);
    const startsWith = (list) =>
      list.filter((item) => item.startsWith(current));
    if (words.length === 1) return startsWith(["kubectl", "clear", "help"]);
    if (words[0] !== "kubectl") return [];
    if (words.length === 2) return startsWith(VERBS);
    if (words[1] === "get") return startsWith(["pods"]);
    if (words[1] === "logs")
      return startsWith([...pods.map((pod) => pod.name), "-f"]);
    if (words[1] === "rollout") return startsWith(["status"]);
    return [];
  }

  let terminal;
  let history = [];

  onMount(() => {
    terminal.run("kubectl get pods");
  });
</script>

<WebTerminal
  bind:this={terminal}
  bind:history
  {execute}
  {complete}
  prompt="user@cluster:~$"
  title="Cluster shell"
  labelText="Cluster shell output"
  height="22rem"
/>
