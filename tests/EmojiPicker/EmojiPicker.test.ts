import { render, screen, waitFor, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import EmojiPicker from "./EmojiPicker.test.svelte";

const field = () => screen.getByRole("combobox", { name: /Emoji/ });
const search = () => screen.getByRole("combobox", { name: "Search emoji" });
const option = (name: string) => screen.getByRole("option", { name });
const output = (id: string) => screen.getByTestId(id);

describe("EmojiPicker", () => {
  it("shows the chosen emoji and its name, and builds no grid until it opens", () => {
    render(EmojiPicker, { value: "thumbs_up", skinTone: 3 });
    expect(field()).toHaveTextContent("thumbs up");
    expect(field()).toHaveAttribute("aria-haspopup", "dialog");
    expect(field()).toHaveAttribute("aria-expanded", "false");
    // The glyph is decoration: the name already says what it is.
    const glyph = field().querySelector(".bx--emoji-picker__chosen");
    expect(glyph).toHaveTextContent("\u{1F44D}\u{1F3FD}");
    expect(glyph).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("writes the chosen glyph, in its skin tone, into a hidden input", () => {
    const { container } = render(EmojiPicker, {
      value: "thumbs_up",
      skinTone: 5,
      name: "status",
    });
    expect(
      container.querySelector<HTMLInputElement>(
        "input[type=hidden][name=status]",
      )?.value,
    ).toBe("\u{1F44D}\u{1F3FF}");
  });

  it("names each option by its CLDR name and hides the glyph from assistive technology", async () => {
    render(EmojiPicker);
    await user.click(field());
    await waitFor(() => expect(search()).toHaveFocus());
    const thumbsUp = option("thumbs up");
    expect(thumbsUp).toHaveAttribute("aria-label", "thumbs up");
    expect(thumbsUp.querySelector(".bx--emoji-picker__glyph")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("finds an emoji by a CLDR keyword and by its shortcode", async () => {
    render(EmojiPicker);
    await user.click(field());
    await user.keyboard("lol");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    expect(option("face with tears of joy")).toBeInTheDocument();
    await user.clear(search());
    await user.keyboard("thumbs_up");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    expect(option("thumbs up")).toBeInTheDocument();
  });

  it("hides the emoji newer than maxVersion", async () => {
    render(EmojiPicker, { maxVersion: 12 });
    await user.click(field());
    expect(screen.getAllByRole("option")).toHaveLength(4);
    expect(screen.queryByRole("option", { name: "troll" })).toBeNull();
  });

  it("shows everything, and tests nothing, where there is no canvas", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(EmojiPicker, { maxVersion: undefined });
    await user.click(field());
    expect(option("troll")).toBeInTheDocument();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  describe("skin tones", () => {
    it("is a radio group with one tab stop, and a choice recolors every emoji with variants", async () => {
      render(EmojiPicker);
      await user.click(field());
      const group = screen.getByRole("radiogroup", { name: "Skin tone" });
      const radios = within(group).getAllByRole("radio");
      expect(radios).toHaveLength(6);
      expect(radios[0]).toHaveAttribute("aria-checked", "true");
      expect(radios.filter((radio) => radio.tabIndex === 0)).toHaveLength(1);

      await user.click(
        within(group).getByRole("radio", { name: "Dark skin tone" }),
      );
      expect(output("skin-tone")).toHaveTextContent("5");
      expect(
        within(group).getByRole("radio", { name: "Dark skin tone" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(option("thumbs up")).toHaveTextContent("\u{1F44D}\u{1F3FF}");
      expect(option("waving hand")).toHaveTextContent("\u{1F44B}\u{1F3FF}");
      // No variants: no modifier.
      expect(option("grinning face")).toHaveTextContent("\u{1F600}");
    });

    it("moves with the arrow keys, and the choice follows focus", async () => {
      render(EmojiPicker);
      await user.click(field());
      screen.getByRole("radio", { name: "Default skin tone" }).focus();
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(
        screen.getByRole("radio", { name: "Medium-light skin tone" }),
      ).toHaveFocus();
      expect(output("skin-tone")).toHaveTextContent("2");
      await user.keyboard("{ArrowLeft}");
      expect(output("skin-tone")).toHaveTextContent("1");
    });
  });

  describe("choosing", () => {
    it("reports the emoji in the chosen tone, closes, and returns focus to the field", async () => {
      render(EmojiPicker, { skinTone: 2 });
      await user.click(field());
      await user.click(option("thumbs up"));
      expect(output("value")).toHaveTextContent("thumbs_up");
      expect(output("selects")).toHaveTextContent(
        "thumbs_up:\u{1F44D}\u{1F3FC}:on",
      );
      expect(field()).toHaveAttribute("aria-expanded", "false");
      expect(field()).toHaveFocus();
    });

    it("toggles in multiple selection and stays open", async () => {
      render(EmojiPicker, {
        variant: "button",
        selectionMode: "multiple",
        values: ["thumbs_up"],
      });
      await user.click(screen.getByRole("button", { name: "Add emoji" }));
      expect(option("thumbs up")).toHaveAttribute("aria-selected", "true");
      await user.click(option("waving hand"));
      expect(output("values")).toHaveTextContent("thumbs_up,waving_hand");
      await user.click(option("thumbs up"));
      expect(output("values")).toHaveTextContent(/^waving_hand$/);
      expect(output("selects")).toHaveTextContent(
        "waving_hand:\u{1F44B}:on thumbs_up:\u{1F44D}:off",
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("lets a button report a choice without holding it", async () => {
      render(EmojiPicker, { variant: "button" });
      const button = screen.getByRole("button", { name: "Add emoji" });
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
      await user.click(button);
      await user.click(option("grinning face"));
      expect(output("selects")).toHaveTextContent("grinning_face");
      expect(output("value")).toHaveTextContent(/^$/);
      expect(button).toHaveFocus();
      await user.click(button);
      for (const cell of screen.getAllByRole("option", {
        name: "grinning face",
      })) {
        expect(cell).toHaveAttribute("aria-selected", "false");
      }
    });
  });

  describe("frequently used", () => {
    it("counts each choice, and shows the most used first when it next opens", async () => {
      render(EmojiPicker, { variant: "button" });
      const button = screen.getByRole("button", { name: "Add emoji" });
      const choose = async (name: string) => {
        await user.click(button);
        await user.click(screen.getAllByRole("option", { name })[0]);
      };
      await choose("waving hand");
      await choose("thumbs up");
      await choose("thumbs up");
      expect(output("usage")).toHaveTextContent(
        JSON.stringify({ waving_hand: 1, thumbs_up: 2 }),
      );
      expect(output("recent")).toHaveTextContent("thumbs_up,waving_hand");

      await user.click(button);
      const group = screen.getByRole("group", { name: "Frequently used" });
      expect(
        within(group)
          .getAllByRole("option")
          .map((cell) => cell.getAttribute("aria-label")),
      ).toEqual(["thumbs up", "waving hand"]);
    });

    it("keeps the section still while the picker is open, so a cell does not move under the pointer", async () => {
      render(EmojiPicker, {
        variant: "button",
        selectionMode: "multiple",
        recent: ["grinning_face"],
      });
      await user.click(screen.getByRole("button", { name: "Add emoji" }));
      const group = () =>
        screen.getByRole("group", { name: "Frequently used" });
      expect(within(group()).getAllByRole("option")).toHaveLength(1);
      await user.click(
        within(screen.getByRole("group", { name: "People & Body" })).getByRole(
          "option",
          { name: "thumbs up" },
        ),
      );
      expect(output("usage")).toHaveTextContent('{"thumbs_up":1}');
      expect(within(group()).getAllByRole("option")).toHaveLength(1);
    });
  });

  it("loads a function source when the picker first opens, or when a value needs it", async () => {
    const { unmount } = render(EmojiPicker, { mode: "function" });
    expect(output("loads")).toHaveTextContent("0");
    await user.click(field());
    await waitFor(() => expect(output("loads")).toHaveTextContent("1"));
    await waitFor(() => expect(option("thumbs up")).toBeInTheDocument());
    unmount();

    render(EmojiPicker, { mode: "function", value: "waving_hand" });
    await waitFor(() => expect(output("loads")).toHaveTextContent("1"));
    await waitFor(() => expect(field()).toHaveTextContent("waving hand"));
  });

  it("renders a button's data only when it opens", () => {
    render(EmojiPicker, { variant: "button", mode: "function" });
    expect(output("loads")).toHaveTextContent("0");
  });

  it("renders the grid on the page, with no trigger, as the inline variant", () => {
    render(EmojiPicker, { variant: "inline" });
    expect(screen.getByRole("listbox", { name: "Emoji" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });
});
