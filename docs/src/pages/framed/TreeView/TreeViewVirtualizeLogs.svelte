<script>
  import {
    Button,
    ButtonSet,
    filterTreeByText,
    InlineNotification,
    Search,
    SelectableTag,
    Stack,
    Tag,
    TreeView,
  } from "carbon-components-svelte";
  import Api from "carbon-icons-svelte/lib/Api.svelte";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import Currency from "carbon-icons-svelte/lib/Currency.svelte";
  import DataCenter from "carbon-icons-svelte/lib/DataCenter.svelte";
  import ErrorFilled from "carbon-icons-svelte/lib/ErrorFilled.svelte";
  import InformationFilled from "carbon-icons-svelte/lib/InformationFilled.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import Password from "carbon-icons-svelte/lib/Password.svelte";
  import ShoppingCart from "carbon-icons-svelte/lib/ShoppingCart.svelte";
  import WarningAltFilled from "carbon-icons-svelte/lib/WarningAltFilled.svelte";
  import { onMount, tick } from "svelte";

  const serviceIcons = {
    "api-gateway": Api,
    "auth-service": Password,
    "payment-service": Currency,
    "checkout-service": ShoppingCart,
    "inventory-worker": DataCenter,
    "notification-scheduler": Notification,
  };

  const services = [
    "api-gateway",
    "auth-service",
    "payment-service",
    "checkout-service",
    "inventory-worker",
    "notification-scheduler",
  ];

  const levels = [
    { name: "ERROR", icon: ErrorFilled, count: 40, status: 500 },
    { name: "WARN", icon: WarningAltFilled, count: 110, status: 429 },
    { name: "INFO", icon: InformationFilled, count: 620, status: 200 },
    { name: "DEBUG", icon: Code, count: 600, status: 200 },
  ];

  const levelTagType = {
    ERROR: "red",
    WARN: "warm-gray",
    INFO: "blue",
    DEBUG: "gray",
  };

  const messages = {
    ERROR: [
      "Connection refused to db-primary:5432",
      "Unhandled exception in request handler",
      "Timeout after 30000ms calling upstream",
      "Failed to acquire lock on resource",
      "OOMKilled: container exceeded memory limit",
    ],
    WARN: [
      "Retrying request (attempt 2/3)",
      "Deprecated API endpoint used",
      "Slow query detected (1240ms)",
      "Cache miss rate above threshold",
      "Connection pool nearing capacity",
    ],
    INFO: [
      "Request completed",
      "User authenticated",
      "Background job scheduled",
      "Configuration reloaded",
      "Healthcheck passed",
    ],
    DEBUG: [
      "Entering handleRequest()",
      "Cache hit for key user:1042",
      "Parsed 42 records from payload",
      "Acquired connection from pool",
      "Span started: db.query",
    ],
  };

  const regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-south-1"];

  let nextId = 0;
  const id = () => nextId++;

  function pad(n, width = 2) {
    return String(n).padStart(width, "0");
  }

  let clock = 0;
  function nextTimestamp() {
    clock += 137;
    const totalMs = clock;
    const ms = totalMs % 1000;
    const totalSec = Math.floor(totalMs / 1000);
    const s = totalSec % 60;
    const m = Math.floor(totalSec / 60) % 60;
    const h = 14 + Math.floor(totalSec / 3600);
    return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
  }

  let lastErrorId = null;
  /** @type {{ lineId: number | null; serviceId: number | null; severityId: number | null }} */
  let lastErrorPath = {
    lineId: null,
    serviceId: null,
    severityId: null,
  };
  /** @type {{ serviceId: number | null; severityId: number | null }} */
  let busiestPath = { serviceId: null, severityId: null };

  function traceId(seed) {
    return (seed * 2654435761).toString(16).slice(0, 12).padStart(12, "0");
  }

  function makeLine(service, level, i, serviceId, severityId) {
    const message = messages[level.name][i % messages[level.name].length];
    const timestamp = nextTimestamp();
    const lineId = id();
    if (level.name === "ERROR") {
      lastErrorId = lineId;
      lastErrorPath = { lineId, serviceId, severityId };
    }
    const lineTraceId = traceId(lineId);
    return {
      id: lineId,
      kind: "line",
      level: level.name,
      timestamp,
      message,
      traceId: lineTraceId,
      status: level.status,
      region: regions[lineId % regions.length],
      text: `${timestamp} ${level.name} ${message} trace_id:${lineTraceId}`,
      nodes: [
        { id: id(), kind: "field", text: `trace_id: ${lineTraceId}` },
        { id: id(), kind: "field", text: `status: ${level.status}` },
        {
          id: id(),
          kind: "field",
          text: `latency_ms: ${50 + ((lineId * 7) % 4200)}`,
        },
        {
          id: id(),
          kind: "field",
          text: `region: ${regions[lineId % regions.length]}`,
        },
        { id: id(), kind: "field", text: `service: ${service}` },
      ],
    };
  }

  const nodes = services.map((service) => {
    const serviceId = id();
    return {
      id: serviceId,
      kind: "service",
      text: service,
      icon: serviceIcons[service],
      nodes: levels.map((level) => {
        const severityId = id();
        if (service === "checkout-service" && level.name === "INFO") {
          busiestPath = { serviceId, severityId };
        }
        return {
          id: severityId,
          kind: "severity",
          level: level.name,
          icon: level.icon,
          count: level.count,
          text: `${level.name} (${level.count.toLocaleString()})`,
          nodes: Array.from({ length: level.count }, (_, i) =>
            makeLine(service, level, i, serviceId, severityId),
          ),
        };
      }),
    };
  });

  function countNodes(list) {
    let n = 0;
    for (const node of list) {
      n++;
      if (node.nodes) n += countNodes(node.nodes);
    }
    return n;
  }

  function allIds(list) {
    const ids = [];
    for (const node of list) {
      ids.push(node.id);
      if (node.nodes) ids.push(...allIds(node.nodes));
    }
    return ids;
  }

  function findNodeById(list, targetId) {
    for (const node of list) {
      if (node.id === targetId) return node;
      if (node.nodes) {
        const found = findNodeById(node.nodes, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  function flattenVisibleRows(nodes, expandedIdsSet) {
    /** @param {typeof nodes} list @param {number} [depth=0] */
    function walk(list, depth = 0) {
      const out = [];
      for (const node of list) {
        const hasChildren = Array.isArray(node.nodes) && node.nodes.length > 0;
        out.push({ node, hasChildren });
        if (hasChildren && expandedIdsSet.has(node.id)) {
          out.push(...walk(node.nodes, depth + 1));
        }
      }
      return out;
    }
    return walk(nodes);
  }

  const totalNodes = countNodes(nodes);
  const totalLines = services.length * levels.reduce((a, l) => a + l.count, 0);

  let treeview = null;
  let searchValue = "";
  let activeId = "";
  let selectedIds = [];
  let expandedIds = [];

  let filterError = true;
  let filterWarn = true;
  let filterInfo = true;
  let filterDebug = true;

  $: enabledLevels = new Set(
    [
      filterError && "ERROR",
      filterWarn && "WARN",
      filterInfo && "INFO",
      filterDebug && "DEBUG",
    ].filter(Boolean),
  );

  $: levelFilteredNodes = nodes.map((service) => ({
    ...service,
    nodes: service.nodes.filter((severity) => enabledLevels.has(severity.level)),
  }));

  $: displayNodes =
    searchValue.trim() === ""
      ? levelFilteredNodes
      : filterTreeByText(levelFilteredNodes, searchValue);

  let prevSearchValue = searchValue;
  let prevFilterKey = "";
  $: {
    const filterKey = [...enabledLevels].sort().join(",");
    if (
      searchValue !== prevSearchValue ||
      filterKey !== prevFilterKey
    ) {
      prevSearchValue = searchValue;
      prevFilterKey = filterKey;
      tick().then(() => scrollContainerRef?.scrollTo({ top: 0 }));
    }
  }

  $: if (searchValue.trim() !== "") {
    expandedIds = allIds(displayNodes);
  }

  $: visibleRowCount = flattenVisibleRows(
    displayNodes,
    new Set(expandedIds),
  ).length;

  $: selectedLine = (() => {
    const targetId = activeId === "" ? selectedIds.at(-1) : activeId;
    if (targetId == null || targetId === "") return null;
    const node = findNodeById(displayNodes, targetId);
    return node?.kind === "line" ? node : null;
  })();

  let scrollContainerRef = null;
  let domRowCount = 0;
  let observer = null;

  function attachObserver(el) {
    observer?.disconnect();
    observer = null;
    if (!el) {
      domRowCount = 0;
      return;
    }
    const recount = () => {
      domRowCount = el.querySelectorAll('[role="treeitem"]').length;
    };
    observer = new MutationObserver(recount);
    observer.observe(el, { childList: true });
    recount();
  }

  $: attachObserver(scrollContainerRef);

  function expandBusiestBranch() {
    if (busiestPath.serviceId == null || busiestPath.severityId == null) return;
    expandedIds = [busiestPath.serviceId, busiestPath.severityId];
  }

  async function jumpToLastError() {
    if (lastErrorPath.lineId == null) return;
    if (
      lastErrorPath.serviceId != null &&
      lastErrorPath.severityId != null
    ) {
      expandedIds = [lastErrorPath.serviceId, lastErrorPath.severityId];
      await tick();
    }
    treeview?.showNode(lastErrorPath.lineId);
  }

  onMount(() => () => observer?.disconnect());
</script>

<Stack gap={5}>
  <ButtonSet>
    <Button
      kind="danger-tertiary"
      size="small"
      disabled={lastErrorPath.lineId === null}
      on:click={jumpToLastError}
    >
      Jump to last error
    </Button>
    <Button kind="tertiary" size="small" on:click={expandBusiestBranch}>
      Expand busiest branch
    </Button>
    <Button
      kind="tertiary"
      size="small"
      on:click={() => {
        treeview?.collapseAll();
        expandedIds = [];
      }}
    >
      Collapse all
    </Button>
  </ButtonSet>

  <Search
    size="sm"
    placeholder="Filter by message or trace_id"
    bind:value={searchValue}
  />

  <Stack gap={2}>
    <span>Severity levels</span>
    <Stack orientation="horizontal" gap={2}>
      <SelectableTag bind:selected={filterError} icon={ErrorFilled}>
        ERROR
      </SelectableTag>
      <SelectableTag bind:selected={filterWarn} icon={WarningAltFilled}>
        WARN
      </SelectableTag>
      <SelectableTag bind:selected={filterInfo} icon={InformationFilled}>
        INFO
      </SelectableTag>
      <SelectableTag bind:selected={filterDebug} icon={Code}>DEBUG</SelectableTag>
    </Stack>
  </Stack>

  <p style:margin="0">
    Total log lines: <strong>{totalLines.toLocaleString()}</strong>
    &middot; total nodes: <strong>{totalNodes.toLocaleString()}</strong>
    &middot; visible rows: <strong>{visibleRowCount.toLocaleString()}</strong>
    &middot; rendered in DOM: <strong>{domRowCount.toLocaleString()}</strong>
  </p>

  {#if displayNodes.length > 0}
    <TreeView
      bind:this={treeview}
      bind:scrollContainerRef
      bind:activeId
      bind:selectedIds
      bind:expandedIds
      labelText="Log explorer"
      nodes={displayNodes}
      virtualize={{ containerHeight: 480 }}
      let:node
    >
      {#if node.kind === "line"}
        <Tag size="sm" type={levelTagType[node.level]}>{node.level}</Tag>
        {node.timestamp}
        {node.message}
      {:else}
        {node.text}
      {/if}
    </TreeView>
  {:else}
    <p>No log lines match the current filters.</p>
  {/if}

  {#if selectedLine}
    <InlineNotification
      lowContrast
      hideCloseButton
      kind={selectedLine.level === "ERROR" ? "error" : "info"}
      title="{selectedLine.timestamp} — {selectedLine.message}"
      subtitle="trace_id: {selectedLine.traceId} · region: {selectedLine.region} · status: {selectedLine.status}"
    />
  {:else}
    <p style:margin="0">Select a log line to inspect fields.</p>
  {/if}
</Stack>
