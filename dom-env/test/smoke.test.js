// Run with `bun test dom-env/test` (or `node --test`). Evaluates the bundle in
// a fresh VM context, the same way the vitest environment does.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
execFileSync("bun", ["run", "build"], { cwd: root, stdio: "ignore" });
const code = fs.readFileSync(path.join(root, "dist/dom-env.js"), "utf8");

function window() {
  const ctx = vm.createContext({
    setTimeout,
    clearTimeout,
    queueMicrotask,
    performance,
    URL,
    DOMException,
    console,
    structuredClone,
    Blob,
    File,
  });
  vm.runInContext(code, ctx);
  vm.runInContext("__domEnv.install({})", ctx);
  return (src) => vm.runInContext(src, ctx);
}

test("parses and serializes HTML, including SVG case fixes", () => {
  const run = window();
  assert.equal(
    run(`const d = document.createElement("div");
      d.innerHTML = '<p class="a">Hi <b>x</b><ul><li>1<li>2</ul><svg viewbox="0 0 1 1"><title>t</title><circle/></svg>';
      d.innerHTML`),
    '<p class="a">Hi <b>x</b></p><ul><li>1</li><li>2</li></ul><svg viewBox="0 0 1 1"><title>t</title><circle></circle></svg>',
  );
});

test("matches selectors and dispatches events through the tree", () => {
  const run = window();
  assert.equal(
    run(`const d = document.createElement("div");
      d.innerHTML = '<ul><li class="x">1</li><li>2</li></ul>';
      document.body.append(d);
      const log = [];
      document.addEventListener("click", (e) => log.push("capture:" + e.eventPhase), true);
      d.addEventListener("click", (e) => log.push("bubble:" + e.eventPhase));
      document.querySelector("ul > li.x:first-child").click();
      [document.querySelectorAll("li:not(.x)").length, ...log].join(",")`),
    "1,capture:1,bubble:3",
  );
});

test("normalizes styles like jsdom", () => {
  const run = window();
  assert.equal(
    run(`const d = document.createElement("div");
      d.style.marginLeft = "0"; d.style.color = "#FFF"; d.style.maxHeight = "20rem";
      [d.getAttribute("style"), getComputedStyle(d).maxHeight].join(" | ")`),
    "margin-left: 0px; color: rgb(255, 255, 255); max-height: 20rem; | 320px",
  );
});

test("forwards label clicks and toggles checkboxes", () => {
  const run = window();
  assert.equal(
    run(`const label = document.createElement("label");
      const box = document.createElement("input"); box.type = "checkbox";
      let changes = 0; box.addEventListener("change", () => changes++);
      label.append(box, "Agree"); document.body.append(label);
      label.click();
      [box.checked, changes].join(",")`),
    "true,1",
  );
});

test("moves focus and skips inert subtrees", () => {
  const run = window();
  assert.equal(
    run(`document.body.innerHTML = '<button id="a">a</button><div inert><button id="b">b</button></div>';
      document.getElementById("a").focus();
      document.getElementById("b").focus();
      document.activeElement.id`),
    "a",
  );
});
