import { render, screen } from "@testing-library/svelte";
import {
  captureFocusTarget,
  focusHandoff,
} from "../../src/utils/focus-handoff.js";
import FocusHandoff from "./FocusHandoff.test.svelte";
import { flushMacrotask } from "./flush-macrotask";
import { user } from "./user";

afterEach(() => {
  document.body.innerHTML = "";
});

const button = (name: string) => screen.getByRole("button", { name });
const hasButton = (name: string) =>
  screen.queryByRole("button", { name }) !== null;

describe.each(["action", "explicit"] as const)(
  "delete in a keyed list (%s)",
  (mode) => {
    it("moves focus to the same control of the next row", async () => {
      const announced: string[] = [];
      render(FocusHandoff, {
        mode,
        onAnnounce: (reason: string) => announced.push(reason),
      });

      button("Delete b").focus();
      await user.keyboard("{Enter}");
      await flushMacrotask();

      expect(hasButton("Delete b")).toBe(false);
      expect(button("Delete c")).toHaveFocus();
      expect(announced).toEqual(["next"]);
    });

    it("moves to the previous row when the last one is deleted", async () => {
      render(FocusHandoff, { mode });

      button("Delete d").focus();
      await user.keyboard("{Enter}");
      await flushMacrotask();

      expect(button("Delete c")).toHaveFocus();
    });

    it("keeps up with a held key that deletes row after row", async () => {
      render(FocusHandoff, { mode });

      button("Delete a").focus();
      for (let i = 0; i < 3; i++) {
        // eslint-disable-next-line no-await-in-loop -- one deletion settles before the next key
        await user.keyboard("{Enter}");
        // eslint-disable-next-line no-await-in-loop -- one deletion settles before the next key
        await flushMacrotask();
      }

      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(button("Delete d")).toHaveFocus();
    });

    it("falls back to the list when the last row is deleted", async () => {
      render(FocusHandoff, { mode, rows: ["only"] });

      button("Delete only").focus();
      await user.keyboard("{Enter}");
      await flushMacrotask();

      expect(screen.getByTestId("list")).toHaveFocus();
    });
  },
);

describe("focus that is not the hand-off's to move", () => {
  it("leaves focus alone when the app removes a row it is not in", async () => {
    render(FocusHandoff, { mode: "action" });

    button("Delete c").focus();
    // The app removes "b" from code (no focus inside "b").
    screen.getByRole("button", { name: "App removes b" }).click();
    await flushMacrotask();

    expect(hasButton("Delete b")).toBe(false);
    expect(button("Delete c")).toHaveFocus();
  });

  it("does not take focus when the removal came from a click elsewhere", async () => {
    render(FocusHandoff, { mode: "action" });

    button("Delete b").focus();
    await user.click(button("App removes b"));
    await flushMacrotask();

    expect(button("App removes b")).toHaveFocus();
  });

  it("does not take focus back after the user clicked away", async () => {
    render(FocusHandoff, { mode: "action" });

    button("Delete c").focus();
    (document.activeElement as HTMLElement).blur();
    await flushMacrotask();
    screen.getByRole("button", { name: "App removes b" }).click();
    await flushMacrotask();

    expect(document.body).toHaveFocus();
  });

  it("does not move focus if the app already did", async () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    const row = document.createElement("div");
    const inner = document.createElement("button");
    row.appendChild(inner);
    document.body.appendChild(row);
    inner.focus();

    const restore = captureFocusTarget(row);
    row.remove();
    outside.focus();

    expect(await restore()).toBe(false);
    expect(outside).toHaveFocus();
  });

  it("does nothing when focus was not inside the element", async () => {
    const a = document.createElement("button");
    const b = document.createElement("button");
    document.body.append(a, b);
    a.focus();

    const restore = captureFocusTarget(b);
    b.remove();

    expect(await restore()).toBe(false);
    expect(a).toHaveFocus();
  });
});

describe("keyed move", () => {
  it("keeps focus on a button that moved in the list", async () => {
    render(FocusHandoff, { mode: "action" });

    button("Up c").focus();
    await user.keyboard("{Enter}");
    await flushMacrotask();

    const ids = screen
      .getAllByRole("listitem")
      .map((li) => li.getAttribute("data-id"));
    expect(ids).toEqual(["a", "c", "b", "d"]);
    expect(button("Up c")).toHaveFocus();
  });
});

describe("a control that becomes its inverse", () => {
  it("finds the new control with `find`", async () => {
    render(FocusHandoff, { mode: "explicit" });

    button("Cancel").focus();
    await user.keyboard("{Enter}");
    await flushMacrotask();

    expect(hasButton("Cancel")).toBe(false);
    expect(button("Retry")).toHaveFocus();
  });
});

describe("focusHandoff", () => {
  function list(count: number) {
    const ul = document.createElement("ul");
    for (let i = 0; i < count; i++) {
      const li = document.createElement("li");
      li.innerHTML = `<button>Item ${i}</button>`;
      ul.appendChild(li);
    }
    document.body.appendChild(ul);
    return ul;
  }

  it("stops watching on destroy", async () => {
    const ul = list(3);
    const action = focusHandoff(ul, { items: "li" });
    ul.querySelectorAll("button")[1].focus();
    action.destroy();
    ul.children[1].remove();
    await flushMacrotask();

    expect(document.body).toHaveFocus();
  });

  it("falls back to the container when nothing is left", async () => {
    const ul = list(1);
    const action = focusHandoff(ul, { items: "li" });
    ul.querySelector("button")?.focus();
    ul.firstElementChild?.remove();
    await flushMacrotask();

    expect(ul).toHaveFocus();
    expect(ul).toHaveAttribute("tabindex", "-1");
    action.destroy();
  });

  it("targets the same control of the next item by position", async () => {
    const ul = document.createElement("ul");
    ul.innerHTML = `
      <li><input aria-label="n0" /><button>Delete 0</button></li>
      <li><input aria-label="n1" /><button>Delete 1</button></li>
    `;
    document.body.appendChild(ul);
    const action = focusHandoff(ul, { items: "li" });
    (ul.querySelectorAll("button")[0] as HTMLElement).focus();
    ul.firstElementChild?.remove();
    await flushMacrotask();

    expect(screen.getByRole("button", { name: "Delete 1" })).toHaveFocus();
    action.destroy();
  });

  it("skips a neighbour that cannot take focus", async () => {
    const ul = list(3);
    const action = focusHandoff(ul, { items: "li" });
    ul.querySelectorAll("button")[1].focus();
    ul.children[2].setAttribute("inert", "");
    ul.children[1].remove();
    await flushMacrotask();

    expect(ul.querySelectorAll("button")[0]).toHaveFocus();
    action.destroy();
  });
});
