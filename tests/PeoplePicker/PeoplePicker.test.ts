import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import PeoplePicker from "./PeoplePicker.test.svelte";

const people = [
  { id: 1, name: "Ada Lovelace", email: "ada@x.com", secondary: "Engineer" },
  { id: 2, name: "Grace Hopper", email: "grace@x.com" },
  { id: 3, name: "Alan Turing", email: "alan@x.com" },
];
const design = {
  id: "g1",
  type: "group" as const,
  name: "Design",
  members: [
    { id: 10, name: "Mei Chen", email: "mei@x.com" },
    { id: 2, name: "Grace Hopper", email: "grace@x.com" },
  ],
};

const input = () => screen.getByRole("combobox", { name: "Assignees" });
const options = () => screen.queryAllByRole("option");
const optionNames = () =>
  options().map(
    (option) => option.querySelector(".bx--people-picker__name")?.textContent,
  );
const shown = () =>
  JSON.parse(screen.getByTestId("value").textContent ?? "[]") as {
    id: unknown;
    name: string;
    invalid?: boolean;
    free?: boolean;
  }[];
const shownNames = () => shown().map((person) => person.name);
const status = () => screen.getByRole("status");
const paste = (text: string) =>
  fireEvent.paste(input(), { clipboardData: { getData: () => text } });

describe("PeoplePicker", () => {
  describe("choosing", () => {
    it("adds the highlighted person on Enter, then clears and closes", async () => {
      const onAdd = vi.fn();
      const onChange = vi.fn();
      render(PeoplePicker, { config: { items: people }, onAdd, onChange });

      await user.type(input(), "ada");
      expect(options()).toHaveLength(1);
      expect(input()).toHaveAttribute("aria-expanded", "true");
      expect(input()).toHaveAttribute("aria-activedescendant", options()[0].id);

      await user.keyboard("{Enter}");

      expect(shownNames()).toEqual(["Ada Lovelace"]);
      expect(input()).toHaveValue("");
      expect(input()).toHaveAttribute("aria-expanded", "false");
      expect(onAdd).toHaveBeenCalledExactlyOnceWith({
        person: people[0],
        source: "menu",
      });
      expect(onChange).toHaveBeenCalledExactlyOnceWith([people[0]]);
      expect(status()).toHaveTextContent("Ada Lovelace added. 1 person.");
    });

    it("lists a person once: the chosen are not offered again", async () => {
      render(PeoplePicker, { value: [people[0]], config: { items: people } });
      await user.type(input(), "a");
      expect(optionNames()).toEqual(["Alan Turing", "Grace Hopper"]);
    });

    it("keeps a person out when the add event is cancelled", async () => {
      render(PeoplePicker, {
        config: { items: people },
        cancelAdd: true,
      });
      await user.type(input(), "ada{Enter}");
      expect(shownNames()).toEqual([]);
    });

    it("moves the highlight with the arrows and wraps", async () => {
      render(PeoplePicker, { config: { items: people } });
      await user.click(input());
      expect(options()).toHaveLength(3);
      const active = () => input().getAttribute("aria-activedescendant");
      expect(active()).toBe(options()[0].id);
      await user.keyboard("{ArrowDown}");
      expect(active()).toBe(options()[1].id);
      await user.keyboard("{ArrowUp}{ArrowUp}");
      expect(active()).toBe(options()[2].id);
      await user.keyboard("{ArrowDown}");
      expect(active()).toBe(options()[0].id);
    });

    it("offers suggestions before typing, and a hint under minQueryLength", async () => {
      render(PeoplePicker, {
        config: {
          items: people,
          suggestions: [people[2]],
          minQueryLength: 2,
        },
      });
      await user.click(input());
      expect(optionNames()).toEqual(["Alan Turing"]);
      expect(screen.getByRole("listbox")).toHaveAccessibleName("Suggested");

      await user.keyboard("g");
      expect(options()).toHaveLength(0);
      expect(
        screen.getByText("Type 2 or more characters to search"),
      ).toBeInTheDocument();
      await user.keyboard("r");
      expect(options()).toHaveLength(1);
    });

    it("closes with Escape without clearing, then clears", async () => {
      render(PeoplePicker, { config: { items: people } });
      await user.type(input(), "ada");
      await user.keyboard("{Escape}");
      expect(options()).toHaveLength(0);
      expect(input()).toHaveValue("ada");
      await user.keyboard("{Escape}");
      expect(input()).toHaveValue("");
    });

    it("replaces the person when multiple is false", async () => {
      render(PeoplePicker, {
        config: { items: people, multiple: false },
      });
      await user.type(input(), "ada{Enter}");
      await user.type(input(), "grace{Enter}");
      expect(shownNames()).toEqual(["Grace Hopper"]);
    });

    it("rejects a person past max with a message", async () => {
      const onInvalid = vi.fn();
      render(PeoplePicker, {
        config: { items: people, max: 1 },
        onInvalid,
      });
      await user.type(input(), "ada{Enter}");
      await user.type(input(), "grace{Enter}");
      expect(shownNames()).toEqual(["Ada Lovelace"]);
      expect(
        screen.getByText("You've reached the maximum number of people"),
      ).toBeInTheDocument();
      expect(onInvalid).toHaveBeenCalledWith({
        value: people[1],
        reason: "max",
      });
    });
  });

  describe("free entries", () => {
    it("offers the typed address as an option, and adds it with Enter", async () => {
      render(PeoplePicker, {
        config: { items: people, allowEmail: true },
      });
      await user.type(input(), "new@acme.io");
      expect(optionNames()).toEqual(["Add new@acme.io"]);
      await user.keyboard("{Enter}");
      expect(shown()).toEqual([
        {
          id: "new@acme.io",
          name: "new@acme.io",
          email: "new@acme.io",
          free: true,
        },
      ]);
    });

    it("does not offer an address that names someone listed", async () => {
      render(PeoplePicker, {
        config: { items: people, allowEmail: true },
      });
      await user.type(input(), "ada@x.com");
      expect(optionNames()).toEqual(["Ada Lovelace"]);
    });

    it("adds on a comma or semicolon and keeps what follows", async () => {
      render(PeoplePicker, { config: { allowEmail: true } });
      await user.type(input(), "a@x.io,b@y.io;c@");
      expect(shown().map((p) => p.name)).toEqual(["a@x.io", "b@y.io"]);
      expect(input()).toHaveValue("c@");
    });

    it("turns text that is not an address into an invalid chip", async () => {
      const onInvalid = vi.fn();
      render(PeoplePicker, {
        config: { allowEmail: true },
        onInvalid,
      });
      await user.type(input(), "bogus{Enter}");

      expect(shown()).toMatchObject([
        { name: "bogus", free: true, invalid: true },
      ]);
      expect(
        screen.getByRole("button", { name: /^Remove bogus\s*, not a valid/ }),
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "1 entry isn't valid",
      );
      expect(input()).toBeInvalid();
      expect(onInvalid).toHaveBeenCalledWith({
        value: expect.objectContaining({ name: "bogus" }),
        reason: "invalid",
      });
    });

    it("keeps the text in the field with invalidEntries reject", async () => {
      render(PeoplePicker, {
        config: { allowEmail: true, invalidEntries: "reject" },
      });
      await user.type(input(), "bogus{Enter}");
      expect(shown()).toEqual([]);
      expect(input()).toHaveValue("bogus");
      expect(
        screen.getByText("Enter a valid email address"),
      ).toBeInTheDocument();
    });

    it("holds the form back while a chip is invalid and never submits it", () => {
      render(PeoplePicker, {
        config: { allowEmail: true, name: "who" },
        value: [
          { id: "a@x.io", name: "a@x.io", email: "a@x.io", free: true },
          { id: "bogus", name: "bogus", free: true, invalid: true },
        ],
      });
      expect(input()).toHaveProperty("validity.customError", true);
      expect(Array.from(new FormData(getForm()).entries())).toEqual([
        ["who", "a@x.io"],
      ]);
    });

    it("reads a pasted list: known people, new addresses, bad entries, duplicates", async () => {
      render(PeoplePicker, {
        config: { items: people, allowEmail: true },
      });
      await paste(
        'grace@x.com, new@acme.io; "Doe, Jane" <jane@acme.io>\nbogus, NEW@acme.io',
      );
      expect(shown().map((p) => p.name)).toEqual([
        "Grace Hopper",
        "new@acme.io",
        "Doe, Jane",
        "bogus",
      ]);
      expect(shown()[3]).toMatchObject({ invalid: true });
      expect(input()).toHaveValue("");
      expect(status()).toHaveTextContent("4 people added. 4 people.");
    });

    it("leaves a pasted list of names in the field without allowEmail", async () => {
      render(PeoplePicker, { config: { items: people } });
      await paste("Ada, Grace");
      expect(shown()).toEqual([]);
    });

    it("resolves a pasted address to the known person without allowEmail", async () => {
      render(PeoplePicker, { config: { items: people } });
      await paste("ada@x.com, alan@x.com");
      expect(shownNames()).toEqual(["Ada Lovelace", "Alan Turing"]);
    });
  });

  describe("groups", () => {
    it("adds a group as one chip by default", async () => {
      render(PeoplePicker, { config: { items: [design, ...people] } });
      await user.type(input(), "design{Enter}");
      expect(shownNames()).toEqual(["Design"]);
    });

    it("adds the members with groups expand, once each", async () => {
      render(PeoplePicker, {
        value: [people[1]],
        config: { items: [design, ...people], groups: "expand" },
      });
      await user.type(input(), "design{Enter}");
      expect(shownNames()).toEqual(["Grace Hopper", "Mei Chen"]);
      expect(status()).toHaveTextContent("Mei Chen added. 2 people.");
    });

    it("loads the members of a group that has none, and says when that fails", async () => {
      const onInvalid = vi.fn();
      const loadMembers = vi
        .fn()
        .mockResolvedValueOnce([people[0]])
        .mockRejectedValueOnce(new Error("offline"));
      const group = { id: "g2", type: "group" as const, name: "Platform" };
      render(PeoplePicker, {
        config: { items: [group], groups: "expand", loadMembers },
        onInvalid,
      });
      await user.type(input(), "plat{Enter}");
      await waitFor(() => expect(shownNames()).toEqual(["Ada Lovelace"]));
      expect(loadMembers.mock.calls[0][0]).toBe(group);

      await user.type(input(), "plat{Enter}");
      await waitFor(() =>
        expect(
          screen.getByText("Could not load the members of this group"),
        ).toBeInTheDocument(),
      );
      expect(onInvalid).toHaveBeenCalledWith({
        value: group,
        reason: "members",
      });
    });
  });

  describe("async source", () => {
    it("ignores a slow answer that arrives after a newer one", async () => {
      let release!: (found: typeof people) => void;
      const slow = new Promise<typeof people>((resolve) => {
        release = resolve;
      });
      const items = vi.fn((query: string) =>
        query === "a"
          ? slow
          : Promise.resolve(query === "al" ? [people[2]] : []),
      );
      render(PeoplePicker, { config: { items, debounce: 0 } });

      await user.type(input(), "al");
      await waitFor(() => expect(optionNames()).toEqual(["Alan Turing"]));
      release(people);
      await tick();
      await tick();
      expect(optionNames()).toEqual(["Alan Turing"]);
      // Opening asks for the empty query first.
      expect(items.mock.calls.map((call) => call[0])).toEqual(["", "a", "al"]);
    });

    it("shows a failure, reports it, and retries with Enter", async () => {
      const onError = vi.fn();
      let calls = 0;
      const items = vi.fn((query: string) => {
        if (query === "ad" && ++calls === 1) {
          return Promise.reject(new Error("offline"));
        }
        return Promise.resolve(query === "ad" ? [people[0]] : []);
      });
      render(PeoplePicker, { config: { items, debounce: 0 }, onError });

      await user.type(input(), "ad");
      await waitFor(() =>
        expect(screen.getByText("Could not load results")).toBeInTheDocument(),
      );
      expect(onError).toHaveBeenCalledWith({ error: expect.any(Error) });
      expect(input()).toHaveAttribute("aria-expanded", "true");

      await user.keyboard("{Enter}");
      await waitFor(() => expect(options()).toHaveLength(1));
      expect(calls).toBe(2);
    });
  });

  describe("chips", () => {
    it("shows the first few and a +N chip until the field has focus", async () => {
      const many = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        name: `Person ${i}`,
      }));
      render(PeoplePicker, { value: many, config: { maxVisible: 3 } });

      expect(screen.getAllByRole("button", { name: /^Remove/ })).toHaveLength(
        3,
      );
      expect(
        screen.getByRole("button", { name: "Show 5 more" }),
      ).toHaveTextContent("+5");

      await user.click(input());
      expect(screen.getAllByRole("button", { name: /^Remove/ })).toHaveLength(
        8,
      );
      expect(screen.queryByRole("button", { name: /Show/ })).toBeNull();
    });

    it("moves to the last chip with Backspace and removes it with Delete", async () => {
      const onRemove = vi.fn();
      render(PeoplePicker, { value: [people[0], people[1]], onRemove });

      await user.click(input());
      await user.keyboard("{Backspace}");
      expect(
        screen.getByRole("button", { name: "Remove Grace Hopper" }),
      ).toHaveFocus();
      await user.keyboard("{Delete}");

      expect(shownNames()).toEqual(["Ada Lovelace"]);
      expect(onRemove).toHaveBeenCalledWith({ person: people[1], index: 1 });
      expect(status()).toHaveTextContent("Grace Hopper removed. 1 person.");
    });
  });

  describe("form", () => {
    it("submits the id of each person, or the address of a free entry", () => {
      render(PeoplePicker, {
        value: [
          people[0],
          { id: "n@x.io", name: "n@x.io", email: "n@x.io", free: true },
        ],
        config: { name: "who" },
      });
      expect(Array.from(new FormData(getForm()).entries())).toEqual([
        ["who", "1"],
        ["who", "n@x.io"],
      ]);
    });

    it("restores the people when the form resets", async () => {
      render(PeoplePicker, { value: [people[0]], config: { items: people } });
      await user.type(input(), "grace{Enter}");
      expect(shownNames()).toEqual(["Ada Lovelace", "Grace Hopper"]);
      await resetForm();
      expect(shownNames()).toEqual(["Ada Lovelace"]);
    });

    it("requires a person, and says so when text is waiting", async () => {
      render(PeoplePicker, { config: { required: true } });
      expect(input()).toBeRequired();
      await user.type(input(), "ad");
      expect(input()).toHaveProperty("validity.customError", true);
    });

    it("lets nobody edit a readonly or disabled field", async () => {
      const { unmount } = render(PeoplePicker, {
        value: [people[0]],
        config: { items: people, readonly: true },
      });
      await user.type(input(), "gr");
      expect(options()).toHaveLength(0);
      expect(screen.queryByRole("button", { name: /^Remove/ })).toBeNull();
      unmount();

      render(PeoplePicker, {
        value: [people[0]],
        config: { items: people, disabled: true },
      });
      expect(input()).toBeDisabled();
      expect(screen.getByRole("button", { name: /^Remove/ })).toBeDisabled();
    });
  });
});
