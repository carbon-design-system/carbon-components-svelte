import { RANDOM_ID_SOURCE } from "./ssr";

export type Diff = {
  path: string;
  kind:
    | "attr"
    | "attr-added"
    | "attr-removed"
    | "tag"
    | "text"
    | "missing"
    | "extra";
  before?: string;
  after?: string;
};

export type BrokenRef = { element: string; attr: string; token: string };

const WHITESPACE = /\s+/g;
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;

/**
 * Unlike `normalizeSSR`, also matches after `--` (`bx--modal-body--ccs-…`).
 * Both trees get the same replacement, so a class or custom property it
 * also matches (`bx--label-description`) can only hide drift inside itself.
 */
const RANDOM_ID = new RegExp(`(?<![a-z0-9])${RANDOM_ID_SOURCE}`, "g");

/** Replacement for every random id, so regenerated ids compare equal. */
const STABLE_ID = "id-#";

function collapse(text: string | null) {
  return (text ?? "").replace(WHITESPACE, " ").trim();
}

function removeComments(node: Node) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === COMMENT_NODE) node.removeChild(child);
    else removeComments(child);
  }
}

/**
 * A copy without Svelte's hydration comments and with adjacent text nodes
 * merged: the server HTML parses `a<!---->b` as two text nodes, while the
 * client may hold one, and vice versa.
 */
function prepare(node: Node) {
  const copy = node.cloneNode(true);
  removeComments(copy);
  copy.normalize();
  return copy;
}

function children(node: Node) {
  return [...node.childNodes].filter(
    (child) =>
      child.nodeType === ELEMENT_NODE ||
      (child.nodeType === TEXT_NODE && collapse(child.textContent) !== ""),
  );
}

function label(element: Element, index: number) {
  const id = element.id ? `#${element.id}` : "";
  return `${element.tagName.toLowerCase()}${id}[${index}]`;
}

function describe(node: Node) {
  return node.nodeType === ELEMENT_NODE
    ? (node as Element).outerHTML.slice(0, 160)
    : collapse(node.textContent);
}

function diffAttributes(a: Element, b: Element, path: string) {
  const diffs: Diff[] = [];
  const names = new Set([...a.getAttributeNames(), ...b.getAttributeNames()]);

  for (const name of names) {
    let before = a.getAttribute(name);
    let after = b.getAttribute(name);
    if (name === "class") {
      before = before === null ? null : collapse(before);
      after = after === null ? null : collapse(after);
    }
    if (before === after) continue;
    // The client sets `value` as a property, so an empty server attribute
    // and a missing client one are the same state.
    if (name === "value" && (before ?? "") === (after ?? "")) continue;

    diffs.push({
      path,
      kind:
        before === null
          ? "attr-added"
          : after === null
            ? "attr-removed"
            : "attr",
      before: `${name}=${before}`,
      after: `${name}=${after}`,
    });
  }

  return diffs;
}

function diffChildren(a: Node, b: Node, path: string): Diff[] {
  const diffs: Diff[] = [];
  const left = children(a);
  const right = children(b);

  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const x = left[i];
    const y = right[i];

    if (!x || !y) {
      const node = x ?? y;
      const name =
        node.nodeType === ELEMENT_NODE
          ? label(node as Element, i)
          : `#text[${i}]`;
      diffs.push(
        x
          ? { path: `${path}/${name}`, kind: "missing", before: describe(x) }
          : { path: `${path}/${name}`, kind: "extra", after: describe(y) },
      );
      continue;
    }

    if (x.nodeType !== y.nodeType) {
      diffs.push({
        path: `${path}/[${i}]`,
        kind: "tag",
        before: x.nodeName,
        after: y.nodeName,
      });
      continue;
    }

    if (x.nodeType === TEXT_NODE) {
      const before = collapse(x.textContent);
      const after = collapse(y.textContent);
      if (before !== after) {
        diffs.push({
          path: `${path}/#text[${i}]`,
          kind: "text",
          before,
          after,
        });
      }
      continue;
    }

    const ex = x as Element;
    const ey = y as Element;
    const here = `${path}/${label(ex, i)}`;

    if (ex.tagName !== ey.tagName) {
      diffs.push({
        path: here,
        kind: "tag",
        before: ex.tagName,
        after: ey.tagName,
      });
      continue;
    }

    diffs.push(...diffAttributes(ex, ey, here), ...diffChildren(ex, ey, here));
  }

  return diffs;
}

/**
 * Positional diff of the children of `a` and `b`. Ignores comments and
 * whitespace-only text, merges adjacent text nodes, and collapses whitespace
 * in text and `class`.
 */
export function diffTrees(a: Node, b: Node) {
  return diffChildren(prepare(a), prepare(b), "");
}

/**
 * Replaces every random `uniqueId()` value in every attribute of `root` and
 * its descendants with `id-#`, in place (pass a clone). Pairing of the
 * regenerated ids is checked separately by `brokenRefs`.
 */
export function normalizeIds(root: Element) {
  for (const element of [root, ...root.querySelectorAll("*")]) {
    for (const name of element.getAttributeNames()) {
      const value = element.getAttribute(name) ?? "";
      const stable = value.replace(RANDOM_ID, STABLE_ID);
      if (stable !== value) element.setAttribute(name, stable);
    }
  }
  return root;
}

/** True if an `attr` diff only swaps one random id for another. */
export function isIdChange(diff: Diff) {
  return (
    diff.kind === "attr" &&
    diff.before !== diff.after &&
    diff.before?.replace(RANDOM_ID, STABLE_ID) ===
      diff.after?.replace(RANDOM_ID, STABLE_ID)
  );
}

const REF_ATTRS = [
  "aria-labelledby",
  "aria-describedby",
  "aria-controls",
  "aria-owns",
  "aria-activedescendant",
  "aria-details",
  "aria-errormessage",
  "aria-flowto",
  "for",
  "list",
  "headers",
];

const REF_TAGS: Record<string, string[]> = {
  for: ["LABEL", "OUTPUT"],
  headers: ["TD", "TH"],
};

/**
 * Every id-reference token under `root` that no element under `root` has
 * as its `id`. Pass `document.body` so portalled targets count.
 */
export function brokenRefs(root: Element) {
  const ids = new Set([...root.querySelectorAll("[id]")].map((el) => el.id));
  const broken: BrokenRef[] = [];

  for (const element of root.querySelectorAll("*")) {
    for (const attr of REF_ATTRS) {
      const value = element.getAttribute(attr);
      if (value === null) continue;
      if (REF_TAGS[attr] && !REF_TAGS[attr].includes(element.tagName)) {
        continue;
      }

      for (const token of value.split(WHITESPACE)) {
        if (token && !ids.has(token)) {
          const className = element.getAttribute("class")?.split(" ")[0];
          broken.push({
            element: `${element.tagName.toLowerCase()}${className ? `.${className}` : ""}`,
            attr,
            token,
          });
        }
      }
    }
  }

  return broken;
}

export type FormControlState = { control: string; value: string };

/**
 * The state of every `input`, `textarea` and `select` under `root`, read
 * from attributes (what the server HTML says) or from properties (what the
 * user sees once the client owns the element).
 */
export function formControlStates(
  root: Element,
  source: "attribute" | "property",
): FormControlState[] {
  return [...root.querySelectorAll("input, textarea, select")].map((el) => {
    const type = (el.getAttribute("type") ?? "text").toLowerCase();
    const id = el.id ? `#${el.id}` : "";

    if (el.tagName === "SELECT") {
      const options = [...(el as HTMLSelectElement).options];
      const selected = options.filter((option) =>
        source === "attribute"
          ? option.hasAttribute("selected")
          : option.selected,
      );
      return {
        control: `select${id}`,
        value: selected.map((option) => option.value).join(","),
      };
    }

    if (el.tagName === "TEXTAREA") {
      return {
        control: `textarea${id}`,
        value:
          source === "attribute"
            ? (el.textContent ?? "")
            : (el as HTMLTextAreaElement).value,
      };
    }

    const input = el as HTMLInputElement;
    if (type === "checkbox" || type === "radio") {
      const checked =
        source === "attribute" ? input.hasAttribute("checked") : input.checked;
      return {
        control: `input[${type}]${id}`,
        value: checked ? "checked" : "",
      };
    }

    return {
      control: `input[${type}]${id}`,
      value:
        source === "attribute"
          ? (input.getAttribute("value") ?? "")
          : input.value,
    };
  });
}
