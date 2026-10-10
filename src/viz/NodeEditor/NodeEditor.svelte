<svelte:options immutable />

<script>
  /**
   * @template [N=any]
   * @template [E=any]
   */

  /**
   * @event {{ ids: string[]; dx: number; dy: number }} move Fires when nodes have been dragged or nudged, with the total distance moved.
   * @event {{ source: string; target: string; sourcePort: string; targetPort: string }} connect Fires before an edge is added. Cancelable: call `preventDefault()` to refuse the connection.
   * @event {{ edge: E }} disconnect Fires when an edge has been removed.
   * @event {{ nodes: N[]; edges: E[] }} remove Fires when nodes and their edges have been removed.
   * @event {{ nodes: string[]; edges: string[] }} select Fires when the selection changes.
   * @event {{ label: string; undo: () => void; redo: () => void }} change Fires after every edit, with the step that was recorded.
   * @event {{ k: number; tx: number; ty: number }} transform Fires when the view pans or zooms.
   * @slot {{ node: { id: string; label: string; datum: N; selected: boolean } }} node
   */

  /** @restProps {figure} */

  /**
   * Specify the nodes. Bind it: the editor writes positions back into new
   * rows and never mutates the ones given.
   * @type {ReadonlyArray<N>}
   */
  export let nodes = [];

  /**
   * Specify the edges. Bind it: the editor adds and removes rows.
   * @type {ReadonlyArray<E>}
   */
  export let edges = [];

  /**
   * Specify how to read a node's id: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<N, string | number>}
   */
  export let id = "id";

  /**
   * Specify how to read a node's label. Defaults to its id.
   * @type {import("../utils/accessor.js").Accessor<N, string | number>}
   */
  export let label = undefined;

  /**
   * Specify the key that holds a node's x, in pixels. Must be a key, since
   * the editor writes it.
   * @type {keyof N & string}
   */
  export let x = /** @type {any} */ ("x");

  /**
   * Specify the key that holds a node's y, in pixels.
   * @type {keyof N & string}
   */
  export let y = /** @type {any} */ ("y");

  /**
   * Specify how to read a node's ports: a function returning a list of
   * `{ id, side, kind }`. Defaults to one `in` port on the left and one
   * `out` port on the right.
   * @type {(row: N, index: number) => ReadonlyArray<{ id: string; side: "top" | "right" | "bottom" | "left"; kind: "in" | "out" }>}
   */
  export let ports = undefined;

  /**
   * Specify the key that holds an edge's id. An edge without one is keyed
   * by its ends.
   * @type {keyof E & string}
   */
  export let edgeId = /** @type {any} */ ("id");

  /**
   * Specify the key that holds an edge's source node id.
   * @type {keyof E & string}
   */
  export let source = /** @type {any} */ ("source");

  /**
   * Specify the key that holds an edge's target node id.
   * @type {keyof E & string}
   */
  export let target = /** @type {any} */ ("target");

  /**
   * Specify the key that holds an edge's source port id.
   * @type {keyof E & string}
   */
  export let sourcePort = /** @type {any} */ ("sourcePort");

  /**
   * Specify the key that holds an edge's target port id.
   * @type {keyof E & string}
   */
  export let targetPort = /** @type {any} */ ("targetPort");

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify the width of a node, in pixels */
  export let nodeWidth = 160;

  /** Specify the height of a node, in pixels */
  export let nodeHeight = 48;

  /** Specify the grid that moves snap to, in pixels. `0` for none. */
  export let snap = 8;

  /**
   * Specify how edges are drawn: straight, with right angles and rounded
   * corners, or as curves.
   * @type {"straight" | "orthogonal" | "curved"}
   */
  export let edge = "orthogonal";

  /**
   * Specify the selection: node ids and edge ids.
   * @type {{ nodes: string[]; edges: string[] }}
   */
  export let selected = { nodes: [], edges: [] };

  /**
   * Specify the view: a scale and a translation in pixels. Leave `null`
   * to fit the whole graph, and bind it to keep the view.
   * @type {{ k: number; tx: number; ty: number } | null}
   */
  export let transform = null;

  /** Specify the smallest scale */
  export let minZoom = 0.25;

  /** Specify the largest scale */
  export let maxZoom = 4;

  /** Specify the height of the stage, in pixels */
  export let height = 480;

  /** Set to `false` to hide the controls */
  export let controls = true;

  /** Set to `false` to hide the minimap */
  export let minimap = true;

  /** Set to `true` to keep the graph as it is: no move, connect, or delete */
  export let readonly = false;

  /**
   * Override the words used for the controls and assistive technology.
   * @type {Record<string, string>}
   */
  export let words = {};

  /**
   * Obtain a reference to the figure element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../../Button/Button.svelte";
  import FitToScreen from "../../icons/FitToScreen.svelte";
  import Flow from "../../icons/Flow.svelte";
  import Redo from "../../icons/Redo.svelte";
  import TrashCan from "../../icons/TrashCan.svelte";
  import Undo from "../../icons/Undo.svelte";
  import ZoomIn from "../../icons/ZoomIn.svelte";
  import ZoomOut from "../../icons/ZoomOut.svelte";
  import { createCommandStack } from "../../utils/command-stack.js";
  import { trackPointerDrag } from "../../utils/pointer-drag.js";
  import { rovingFocus } from "../../utils/roving-focus.js";
  import {
    fit as fitView,
    identity,
    toWorld,
    viewport,
    zoomAt,
  } from "../../utils/viewport.js";
  import { toAccessor } from "../utils/accessor.js";
  import { layoutLayered } from "../utils/layout-layered.js";
  import { nextId } from "../utils/next-id.js";
  import { observeResize } from "../utils/resize-pool.js";
  import { portPoint, routePorts } from "../utils/route-edge.js";

  const dispatch = createEventDispatcher();
  const PAD = 24;
  const markerId = nextId("bx-viz-editor-arrow");
  const stack = createCommandStack();
  const { canUndo, canRedo } = stack;

  /** @type {HTMLElement | null} */
  let stage = null;
  let stageWidth = 0;
  let stageHeight = 0;
  let focusIndex = 0;
  let gesture = 0;
  // Focus that came from a press must not pan the stage under the pointer.
  let pressed = false;
  /** @type {{ from: string; port: string; x: number; y: number; over: { node: string; port: string } | null } | null} */
  let linking = null;
  /** @type {{ x0: number; y0: number; x1: number; y1: number } | null} */
  let marquee = null;
  // A marquee ends with a click on the floor, which must not clear it.
  let swept = false;
  let announcement = "";

  $: idOf = toAccessor(id);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: text = {
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fit: "Fit to view",
    layout: "Arrange",
    undo: "Undo",
    redo: "Redo",
    remove: "Remove selected",
    node: "Node",
    edge: "Edge",
    to: "to",
    connecting: "connecting from",
    connected: "connected",
    refused: "not allowed",
    moved: "moved",
    removed: "removed",
    selectedWord: "selected",
    ...words,
  };
  // Every node with its box and ports, in the order given.
  $: boxes = nodes.map((row, i) => {
    const key = String(idOf(row, i));
    const rec = /** @type {Record<string, unknown>} */ (row);
    const w = Number(rec.width) || nodeWidth;
    const h = Number(rec.height) || nodeHeight;
    return {
      id: key,
      label: labelOf ? String(labelOf(row, i) ?? key) : key,
      x: Number(rec[x]) || 0,
      y: Number(rec[y]) || 0,
      width: w,
      height: h,
      ports: ports
        ? [...ports(row, i)]
        : [
            {
              id: "in",
              side: /** @type {const} */ ("left"),
              kind: /** @type {const} */ ("in"),
            },
            {
              id: "out",
              side: /** @type {const} */ ("right"),
              kind: /** @type {const} */ ("out"),
            },
          ],
      datum: row,
      index: i,
    };
  });
  $: boxOf = new Map(boxes.map((box) => [box.id, box]));
  $: wires = routeWires(edges, boxOf, edge);
  $: bounds = extent(boxes);
  $: view =
    transform ??
    (stageWidth > 0
      ? fitView(
          bounds,
          { width: stageWidth, height: stageHeight },
          { padding: 8, min: 0.02, max: 1 },
        )
      : identity());
  $: selectedNodes = new Set(selected.nodes);
  $: selectedEdges = new Set(selected.edges);
  $: window_ = {
    a: toWorld(view, 0, 0),
    b: toWorld(view, stageWidth, stageHeight),
  };
  $: linkPath = linking ? previewPath(linking) : "";

  /**
   * Every edge with its path. Edges that share a port take channels a few
   * pixels apart, so they never lie on one another.
   * @param {ReadonlyArray<E>} rows
   * @param {Map<string, (typeof boxes)[number]>} at
   * @param {"straight" | "orthogonal" | "curved"} kind
   */
  function routeWires(rows, at, kind) {
    const resolved = rows.flatMap((row, i) => {
      const rec = /** @type {Record<string, unknown>} */ (row);
      const from = at.get(String(rec[source]));
      const to = at.get(String(rec[target]));
      if (!from || !to) return [];
      const outKey = `${from.id}\u0000${rec[sourcePort] ?? ""}`;
      const inKey = `${to.id}\u0000${rec[targetPort] ?? ""}`;
      return [{ row, i, from, to, outKey, inKey }];
    });
    /** @type {Map<string, number>} */
    const outCount = new Map();
    /** @type {Map<string, number>} */
    const inCount = new Map();
    for (const entry of resolved) {
      outCount.set(entry.outKey, (outCount.get(entry.outKey) ?? 0) + 1);
      inCount.set(entry.inKey, (inCount.get(entry.inKey) ?? 0) + 1);
    }
    /** @type {Map<string, number>} */
    const outSeen = new Map();
    /** @type {Map<string, number>} */
    const inSeen = new Map();
    const GAP = 10;
    return resolved.map(({ row, i, from, to, outKey, inKey }) => {
      const rec = /** @type {Record<string, unknown>} */ (row);
      const outIndex = outSeen.get(outKey) ?? 0;
      const inIndex = inSeen.get(inKey) ?? 0;
      outSeen.set(outKey, outIndex + 1);
      inSeen.set(inKey, inIndex + 1);
      const spread = (/** @type {number} */ index, /** @type {number} */ n) =>
        (index - (n - 1) / 2) * GAP;
      const offset =
        spread(inIndex, inCount.get(inKey) ?? 1) +
        spread(outIndex, outCount.get(outKey) ?? 1);
      const a = portOn(from, String(rec[sourcePort] ?? ""), "out");
      const b = portOn(to, String(rec[targetPort] ?? ""), "in");
      return {
        id: edgeKey(row),
        source: from.id,
        target: to.id,
        d: routePorts(a, b, { kind, offset }),
        datum: row,
        index: i,
      };
    });
  }

  /** @param {E} row */
  function edgeKey(row) {
    const rec = /** @type {Record<string, unknown>} */ (row);
    return rec[edgeId] !== undefined && rec[edgeId] !== null
      ? String(rec[edgeId])
      : `${rec[source]}\u0000${rec[sourcePort] ?? ""}\u0000${rec[target]}\u0000${rec[targetPort] ?? ""}`;
  }

  /**
   * A port's point on its node: the named one, or the first of its kind.
   * @param {(typeof boxes)[number]} box
   * @param {string} name
   * @param {"in" | "out"} kind
   */
  function portOn(box, name, kind) {
    const port =
      box.ports.find((entry) => entry.id === name) ??
      box.ports.find((entry) => entry.kind === kind) ??
      box.ports[0];
    const side = port ? port.side : kind === "in" ? "left" : "right";
    const siblings = box.ports.filter((entry) => entry.side === side);
    const at = port
      ? (siblings.indexOf(port) + 1) / (siblings.length + 1)
      : 0.5;
    return portPoint(box, side, at);
  }

  /** @param {ReadonlyArray<(typeof boxes)[number]>} list */
  function extent(list) {
    let x0 = 0;
    let y0 = 0;
    let x1 = 200;
    let y1 = 100;
    for (const box of list) {
      x0 = Math.min(x0, box.x);
      y0 = Math.min(y0, box.y);
      x1 = Math.max(x1, box.x + box.width);
      y1 = Math.max(y1, box.y + box.height);
    }
    return { x0: x0 - PAD, y0: y0 - PAD, x1: x1 + PAD, y1: y1 + PAD };
  }

  /** @param {NonNullable<typeof linking>} link */
  function previewPath(link) {
    const from = boxOf.get(link.from);
    if (!from) return "";
    const a = portOn(from, link.port, "out");
    const over = link.over ? boxOf.get(link.over.node) : undefined;
    const b = over
      ? portOn(over, link.over?.port ?? "", "in")
      : { x: link.x, y: link.y, dx: -1, dy: 0 };
    return routePorts(a, b, { kind: edge });
  }

  /**
   * Record an edit: apply it, remember how to undo it, and tell the
   * consumer.
   * @param {{ label: string; do: () => void; undo: () => void; key?: string }} command
   */
  function edit(command) {
    stack.execute(command);
    dispatch("change", {
      label: command.label,
      undo: command.undo,
      redo: command.do,
    });
  }

  /**
   * @param {ReadonlyArray<string>} ids
   * @param {number} dx
   * @param {number} dy
   * @param {string} [key]
   */
  function moveNodes(ids, dx, dy, key) {
    if (readonly || (dx === 0 && dy === 0)) return;
    const wanted = new Set(ids);
    const shift = (/** @type {number} */ sx, /** @type {number} */ sy) => {
      nodes = nodes.map((row, i) =>
        wanted.has(String(idOf(row, i)))
          ? {
              ...row,
              [x]: (Number(/** @type {any} */ (row)[x]) || 0) + sx,
              [y]: (Number(/** @type {any} */ (row)[y]) || 0) + sy,
            }
          : row,
      );
    };
    edit({
      label: text.moved,
      key,
      do: () => shift(dx, dy),
      undo: () => shift(-dx, -dy),
    });
    dispatch("move", { ids: [...ids], dx, dy });
  }

  /**
   * @param {string} from
   * @param {string} fromPort
   * @param {string} to
   * @param {string} toPort
   */
  function connect(from, fromPort, to, toPort) {
    if (readonly || from === to) return false;
    const exists = wires.some(
      (wire) =>
        wire.source === from &&
        wire.target === to &&
        String(/** @type {any} */ (wire.datum)[sourcePort] ?? "") ===
          fromPort &&
        String(/** @type {any} */ (wire.datum)[targetPort] ?? "") === toPort,
    );
    if (exists) return false;
    const detail = {
      source: from,
      target: to,
      sourcePort: fromPort,
      targetPort: toPort,
    };
    const allowed = dispatch("connect", detail, { cancelable: true });
    if (!allowed) {
      announcement = `${text.refused}: ${labelFor(from)} ${text.to} ${labelFor(to)}`;
      return false;
    }
    const row = /** @type {E} */ ({
      [source]: from,
      [target]: to,
      [sourcePort]: fromPort,
      [targetPort]: toPort,
    });
    edit({
      label: text.connected,
      do: () => {
        edges = [...edges, row];
      },
      undo: () => {
        edges = edges.filter((entry) => entry !== row);
      },
    });
    announcement = `${text.connected} ${labelFor(from)} ${text.to} ${labelFor(to)}`;
    return true;
  }

  function removeSelected() {
    if (readonly) return;
    const goneNodes = nodes.filter((row, i) =>
      selectedNodes.has(String(idOf(row, i))),
    );
    const goneIds = new Set(goneNodes.map((row, i) => String(idOf(row, i))));
    const goneEdges = edges.filter((row) => {
      const rec = /** @type {Record<string, unknown>} */ (row);
      return (
        selectedEdges.has(edgeKey(row)) ||
        goneIds.has(String(rec[source])) ||
        goneIds.has(String(rec[target]))
      );
    });
    if (goneNodes.length === 0 && goneEdges.length === 0) return;
    const keepNodes = nodes.filter((row) => !goneNodes.includes(row));
    const keepEdges = edges.filter((row) => !goneEdges.includes(row));
    const before = { nodes, edges };
    edit({
      label: text.removed,
      do: () => {
        nodes = keepNodes;
        edges = keepEdges;
      },
      undo: () => {
        nodes = before.nodes;
        edges = before.edges;
      },
    });
    for (const row of goneEdges) dispatch("disconnect", { edge: row });
    dispatch("remove", { nodes: goneNodes, edges: goneEdges });
    setSelection([], []);
    announcement = `${goneNodes.length + goneEdges.length} ${text.removed}`;
    // Focus stays on the stage: the node at the same place, or the last.
    tick().then(() => {
      const remaining = /** @type {HTMLElement | null} */ (
        stage
      )?.querySelectorAll(".bx--viz-editor__node");
      if (!remaining || remaining.length === 0) return;
      const index = Math.min(focusIndex, remaining.length - 1);
      /** @type {HTMLElement} */ (remaining[index]).focus();
    });
  }

  function arrange() {
    if (readonly) return;
    const laid = layoutLayered(
      boxes.map((box) => ({ id: box.id, datum: box.datum })),
      wires.map((wire) => ({ source: wire.source, target: wire.target })),
      { rankDir: "LR", nodeWidth, nodeHeight, rankGap: 64, nodeGap: 24 },
    );
    const at = new Map(laid.nodes.map((node) => [node.id, node]));
    const before = nodes;
    const after = nodes.map((row, i) => {
      const placed = at.get(String(idOf(row, i)));
      return placed ? { ...row, [x]: placed.x, [y]: placed.y } : row;
    });
    edit({
      label: text.layout,
      do: () => {
        nodes = after;
      },
      undo: () => {
        nodes = before;
      },
    });
    transform = null;
  }

  /**
   * @param {string[]} nodeIds
   * @param {string[]} edgeIds
   */
  function setSelection(nodeIds, edgeIds) {
    selected = { nodes: nodeIds, edges: edgeIds };
    dispatch("select", { nodes: nodeIds, edges: edgeIds });
  }

  /** @param {string} key */
  function labelFor(key) {
    return boxOf.get(key)?.label ?? key;
  }

  /** @param {{ k: number; tx: number; ty: number }} next */
  function setView(next) {
    transform = next;
    dispatch("transform", next);
  }

  /** @param {number} factor */
  function zoomBy(factor) {
    setView(
      zoomAt(view, factor, stageWidth / 2, stageHeight / 2, {
        min: minZoom,
        max: maxZoom,
      }),
    );
  }

  function fitAll() {
    transform = null;
    dispatch("transform", view);
  }

  /** @param {number} value */
  function snapped(value) {
    return snap > 0 ? Math.round(value / snap) * snap : value;
  }

  /**
   * Svelte action: drag a node to move it, and every selected node with
   * it, in one undo step per gesture.
   * @param {HTMLElement} node
   * @param {string} key
   */
  function draggable(node, key) {
    let current = key;
    let dx = 0;
    let dy = 0;
    let acc = { x: 0, y: 0 };
    const stop = trackPointerDrag(node, {
      scale: () => view.k,
      accept: (event) =>
        !readonly &&
        /** @type {Element} */ (event.target).closest(
          ".bx--viz-editor__port",
        ) === null,
      onStart: () => {
        gesture += 1;
        dx = 0;
        dy = 0;
        acc = { x: 0, y: 0 };
        node.classList.add("bx--viz-editor__node--dragging");
      },
      onMove: (mx, my) => {
        acc.x += mx;
        acc.y += my;
        const nx = snapped(acc.x);
        const ny = snapped(acc.y);
        const stepX = nx - dx;
        const stepY = ny - dy;
        if (stepX === 0 && stepY === 0) return;
        dx = nx;
        dy = ny;
        const ids = selectedNodes.has(current) ? [...selectedNodes] : [current];
        moveNodes(ids, stepX, stepY, `move:${gesture}`);
      },
      onEnd: () => {
        node.classList.remove("bx--viz-editor__node--dragging");
        stack.seal();
      },
    });
    return {
      /** @param {string} next */
      update(next) {
        current = next;
      },
      destroy: stop,
    };
  }

  /**
   * Svelte action: drag from an out port to draw a connection, dropped on
   * a node or one of its in ports.
   * @param {HTMLElement} node
   * @param {{ from: string; port: string }} at
   */
  function connectable(node, at) {
    let current = at;
    const stop = trackPointerDrag(node, {
      threshold: 1,
      accept: () => !readonly,
      onStart: (event) => {
        const world = pointerWorld(event);
        linking = {
          from: current.from,
          port: current.port,
          x: world.x,
          y: world.y,
          over: null,
        };
      },
      onMove: (_dx, _dy, event) => {
        if (!linking) return;
        const world = pointerWorld(event);
        const hit = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest(".bx--viz-editor__node, .bx--viz-editor__port");
        let over = null;
        if (hit) {
          const nodeEl = /** @type {HTMLElement} */ (
            hit.closest(".bx--viz-editor__node")
          );
          const nodeId = nodeEl?.dataset.node ?? "";
          const portId =
            /** @type {HTMLElement} */ (hit).dataset.port ??
            boxOf.get(nodeId)?.ports.find((p) => p.kind === "in")?.id ??
            "";
          if (nodeId && nodeId !== linking.from)
            over = { node: nodeId, port: portId };
        }
        linking = { ...linking, x: world.x, y: world.y, over };
      },
      onEnd: () => {
        if (linking?.over) {
          connect(
            linking.from,
            linking.port,
            linking.over.node,
            linking.over.port,
          );
        }
        linking = null;
      },
    });
    return {
      /** @param {{ from: string; port: string }} next */
      update(next) {
        current = next;
      },
      destroy: stop,
    };
  }

  /** @param {PointerEvent} event */
  function pointerWorld(event) {
    const rect = /** @type {HTMLElement} */ (stage).getBoundingClientRect();
    return toWorld(view, event.clientX - rect.left, event.clientY - rect.top);
  }

  /**
   * Svelte action on the stage: Shift and a drag on the floor sweeps out
   * a marquee that selects the nodes inside it.
   * @param {HTMLElement} node
   */
  function marqueeable(node) {
    let origin = { x: 0, y: 0 };
    const stop = trackPointerDrag(node, {
      accept: (event) =>
        event.shiftKey &&
        /** @type {Element} */ (event.target).closest(
          ".bx--viz-editor__node",
        ) === null,
      onStart: (event) => {
        origin = pointerWorld(event);
        marquee = { x0: origin.x, y0: origin.y, x1: origin.x, y1: origin.y };
      },
      onMove: (_dx, _dy, event) => {
        const at = pointerWorld(event);
        marquee = {
          x0: Math.min(origin.x, at.x),
          y0: Math.min(origin.y, at.y),
          x1: Math.max(origin.x, at.x),
          y1: Math.max(origin.y, at.y),
        };
      },
      onEnd: () => {
        if (marquee) {
          const box = marquee;
          const inside = boxes
            .filter(
              (entry) =>
                entry.x < box.x1 &&
                entry.x + entry.width > box.x0 &&
                entry.y < box.y1 &&
                entry.y + entry.height > box.y0,
            )
            .map((entry) => entry.id);
          setSelection(inside, []);
          swept = true;
        }
        marquee = null;
      },
    });
    return { destroy: stop };
  }

  /**
   * @param {MouseEvent} event
   * @param {string} key
   */
  function clickNode(event, key) {
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      const next = selectedNodes.has(key)
        ? selected.nodes.filter((entry) => entry !== key)
        : [...selected.nodes, key];
      setSelection(next, selected.edges);
    } else {
      setSelection([key], []);
    }
  }

  /** @param {string} key */
  function clickEdge(key) {
    setSelection([], selectedEdges.has(key) ? [] : [key]);
  }

  /**
   * Shift and arrows nudge, C starts a keyboard connection and Enter lands
   * it, Delete removes, Ctrl or Cmd with Z and Y undo and redo.
   * @param {KeyboardEvent} event
   * @param {(typeof boxes)[number]} box
   */
  function onNodeKeydown(event, box) {
    const step = snap || 8;
    const arrows = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (event.shiftKey && event.key in arrows) {
      event.preventDefault();
      event.stopPropagation();
      const [dx, dy] = arrows[/** @type {keyof typeof arrows} */ (event.key)];
      const ids = selectedNodes.has(box.id) ? [...selectedNodes] : [box.id];
      moveNodes(ids, dx, dy);
      return;
    }
    if (event.key === "c" || event.key === "C") {
      event.preventDefault();
      if (linking?.from === box.id) {
        linking = null;
        announcement = "";
        return;
      }
      const port = box.ports.find((p) => p.kind === "out")?.id ?? "out";
      const point = portOn(box, port, "out");
      linking = { from: box.id, port, x: point.x, y: point.y, over: null };
      announcement = `${text.connecting} ${box.label}`;
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      if (linking && linking.from !== box.id) {
        event.preventDefault();
        const port = box.ports.find((p) => p.kind === "in")?.id ?? "in";
        connect(linking.from, linking.port, box.id, port);
        linking = null;
      }
      return;
    }
    if (event.key === "Escape" && linking) {
      linking = null;
      announcement = "";
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      if (!selectedNodes.has(box.id)) setSelection([box.id], []);
      tick().then(removeSelected);
      return;
    }
    onStageKeydown(event);
  }

  /** @param {KeyboardEvent} event */
  function onStageKeydown(event) {
    const mod = event.metaKey || event.ctrlKey;
    if (mod && (event.key === "z" || event.key === "Z")) {
      event.preventDefault();
      if (event.shiftKey) stack.redo();
      else stack.undo();
    } else if (mod && (event.key === "y" || event.key === "Y")) {
      event.preventDefault();
      stack.redo();
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomBy(1.25);
    } else if (event.key === "-") {
      event.preventDefault();
      zoomBy(0.8);
    } else if (event.key === "0") {
      event.preventDefault();
      fitAll();
    }
  }

  /** @param {PointerEvent} event */
  function isFloor(event) {
    const hit = /** @type {Element | null} */ (event.target);
    return (
      !event.shiftKey &&
      (hit === null ||
        hit.closest(
          ".bx--viz-editor__node, .bx--viz-editor__edge-hit, .bx--viz-editor__port",
        ) === null)
    );
  }

  /** @param {MouseEvent} event */
  function onFloorClick(event) {
    if (swept) {
      swept = false;
      return;
    }
    const hit = /** @type {Element | null} */ (event.target);
    if (
      hit?.closest(
        ".bx--viz-editor__node, .bx--viz-editor__edge-hit, .bx--viz-editor__port",
      )
    )
      return;
    if (selected.nodes.length || selected.edges.length) setSelection([], []);
  }

  /** As nodes move, keep the focused node's index in range. */
  $: if (focusIndex >= boxes.length) focusIndex = Math.max(boxes.length - 1, 0);

  /** @param {(typeof boxes)[number]} box */
  function reveal(box) {
    const x0 = box.x * view.k + view.tx;
    const y0 = box.y * view.k + view.ty;
    const x1 = x0 + box.width * view.k;
    const y1 = y0 + box.height * view.k;
    if (x0 >= 0 && y0 >= 0 && x1 <= stageWidth && y1 <= stageHeight) return;
    setView({
      k: view.k,
      tx: stageWidth / 2 - (box.x + box.width / 2) * view.k,
      ty: stageHeight / 2 - (box.y + box.height / 2) * view.k,
    });
  }

  /** Undo the last edit. */
  export function undo() {
    return stack.undo();
  }

  /** Redo the last undone edit. */
  export function redo() {
    return stack.redo();
  }

  onMount(() => {
    if (!stage) return;
    return observeResize(stage, (w, h) => {
      stageWidth = Math.round(w);
      stageHeight = Math.round(h);
    });
  });
</script>

<figure bind:this={ref} class:bx--viz-editor={true} {...$$restProps}>
  <div class:bx--viz-editor__header={true}>
    {#if title}
      <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
    {/if}
    {#if controls}
      <div class:bx--viz-editor__controls={true}>
        {#if !readonly}
          <Button
            kind="ghost"
            size="small"
            icon={Undo}
            iconDescription={text.undo}
            tooltipPosition="bottom"
            tooltipAlignment="end"
            disabled={!$canUndo}
            on:click={() => stack.undo()}
          />
          <Button
            kind="ghost"
            size="small"
            icon={Redo}
            iconDescription={text.redo}
            tooltipPosition="bottom"
            tooltipAlignment="end"
            disabled={!$canRedo}
            on:click={() => stack.redo()}
          />
          <Button
            kind="ghost"
            size="small"
            icon={TrashCan}
            iconDescription={text.remove}
            tooltipPosition="bottom"
            tooltipAlignment="end"
            disabled={selected.nodes.length === 0 &&
              selected.edges.length === 0}
            on:click={removeSelected}
          />
          <Button
            kind="ghost"
            size="small"
            icon={Flow}
            iconDescription={text.layout}
            tooltipPosition="bottom"
            tooltipAlignment="end"
            on:click={arrange}
          />
        {/if}
        <Button
          kind="ghost"
          size="small"
          icon={ZoomIn}
          iconDescription={text.zoomIn}
          tooltipPosition="bottom"
          tooltipAlignment="end"
          on:click={() => zoomBy(1.25)}
        />
        <Button
          kind="ghost"
          size="small"
          icon={ZoomOut}
          iconDescription={text.zoomOut}
          tooltipPosition="bottom"
          tooltipAlignment="end"
          on:click={() => zoomBy(0.8)}
        />
        <Button
          kind="ghost"
          size="small"
          icon={FitToScreen}
          iconDescription={text.fit}
          tooltipPosition="bottom"
          tooltipAlignment="end"
          on:click={fitAll}
        />
      </div>
    {/if}
  </div>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={stage}
    class:bx--viz-editor__stage={true}
    class:bx--viz-editor__stage--linking={linking !== null}
    style:height="{height}px"
    use:viewport={{
      get: () => view,
      set: setView,
      min: minZoom,
      max: maxZoom,
      accept: isFloor,
    }}
    use:marqueeable
    on:click={onFloorClick}
  >
    <svg
      class:bx--viz-editor__edges={true}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path class:bx--viz-editor__arrow={true} d="M0,0L10,5L0,10Z" />
        </marker>
      </defs>
      <g transform="translate({view.tx} {view.ty}) scale({view.k})">
        {#each wires as wire (wire.id)}
          <g
            class:bx--viz-editor__edge={true}
            class:bx--viz-editor__edge--selected={selectedEdges.has(wire.id)}
          >
            <path
              class:bx--viz-editor__edge-line={true}
              d={wire.d}
              marker-end="url(#{markerId})"
            />
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <path
              class:bx--viz-editor__edge-hit={true}
              d={wire.d}
              on:click|stopPropagation={() => clickEdge(wire.id)}
            />
          </g>
        {/each}
        {#if linkPath}
          <path class:bx--viz-editor__link={true} d={linkPath} />
        {/if}
        {#if marquee}
          <rect
            class:bx--viz-editor__marquee={true}
            x={marquee.x0}
            y={marquee.y0}
            width={marquee.x1 - marquee.x0}
            height={marquee.y1 - marquee.y0}
          />
        {/if}
      </g>
    </svg>
    <div
      class:bx--viz-editor__nodes={true}
      style:transform="translate({view.tx}px, {view.ty}px) scale({view.k})"
      role="group"
      aria-label={title || undefined}
      use:rovingFocus={{
        selector: ".bx--viz-editor__node",
        orientation: "both",
        focusOnMove: true,
        getActiveIndex: () => focusIndex,
        onMove: (index, event) => {
          if (event.shiftKey) return;
          focusIndex = index;
        },
      }}
    >
      {#each boxes as box, i (box.id)}
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <div
          class:bx--viz-editor__node={true}
          class:bx--viz-editor__node--selected={selectedNodes.has(box.id)}
          class:bx--viz-editor__node--target={linking?.over?.node === box.id ||
            (linking !== null && linking.from !== box.id && focusIndex === i)}
          class:bx--viz-editor__node--source={linking?.from === box.id}
          style:left="{box.x}px"
          style:top="{box.y}px"
          style:width="{box.width}px"
          style:height="{box.height}px"
          data-node={box.id}
          role="button"
          tabindex={i === focusIndex ? 0 : -1}
          aria-pressed={selectedNodes.has(box.id)}
          aria-label="{text.node}: {box.label}"
          use:draggable={box.id}
          on:pointerdown={() => {
            pressed = true;
          }}
          on:click|stopPropagation={(event) => clickNode(event, box.id)}
          on:focus={() => {
            focusIndex = i;
            const byKeyboard = !pressed;
            pressed = false;
            if (byKeyboard) tick().then(() => reveal(box));
          }}
          on:keydown={(event) => onNodeKeydown(event, box)}
        >
          <slot
            name="node"
            node={{
              id: box.id,
              label: box.label,
              datum: box.datum,
              selected: selectedNodes.has(box.id),
            }}
          >
            <span class:bx--viz-editor__label={true}>{box.label}</span>
          </slot>
          {#each box.ports as port (port.id)}
            {@const at = portOn(box, port.id, port.kind)}
            {#if port.kind === "out" && !readonly}
              <span
                class:bx--viz-editor__port={true}
                class:bx--viz-editor__port--out={true}
                style:left="{at.x - box.x}px"
                style:top="{at.y - box.y}px"
                data-port={port.id}
                use:connectable={{ from: box.id, port: port.id }}
              ></span>
            {:else}
              <span
                class:bx--viz-editor__port={true}
                class:bx--viz-editor__port--in={port.kind === "in"}
                style:left="{at.x - box.x}px"
                style:top="{at.y - box.y}px"
                data-port={port.id}
              ></span>
            {/if}
          {/each}
        </div>
      {/each}
    </div>
    {#if minimap && boxes.length > 0}
      <svg
        class:bx--viz-editor__minimap={true}
        viewBox="{bounds.x0} {bounds.y0} {bounds.x1 - bounds.x0} {bounds.y1 -
          bounds.y0}"
        aria-hidden="true"
        focusable="false"
      >
        {#each boxes as box (box.id)}
          <rect
            class:bx--viz-editor__minimap-node={true}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
          />
        {/each}
        {#if stageWidth > 0}
          <rect
            class:bx--viz-editor__minimap-window={true}
            x={window_.a.x}
            y={window_.a.y}
            width={Math.max(window_.b.x - window_.a.x, 0)}
            height={Math.max(window_.b.y - window_.a.y, 0)}
          />
        {/if}
      </svg>
    {/if}
  </div>
  <!-- Every node and edge, for assistive technology. -->
  <ul class:bx--visually-hidden={true}>
    {#each boxes as box (box.id)}
      <li>
        {text.node}:
        {box.label}{selectedNodes.has(box.id) ? `, ${text.selectedWord}` : ""}
      </li>
    {/each}
    {#each wires as wire (wire.id)}
      <li>
        {text.edge}: {labelFor(wire.source)} {text.to} {labelFor(wire.target)}
      </li>
    {/each}
  </ul>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
