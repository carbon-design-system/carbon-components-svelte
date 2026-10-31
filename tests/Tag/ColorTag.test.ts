import { render, screen } from "@testing-library/svelte";
import { getAvatarBackgroundColor } from "../../src/utils/avatar-color.js";
import { user } from "../utils/user";
import ColorTag from "./ColorTag.test.svelte";

const tagOf = (text: string) => {
  const tag = screen.getByText(text).closest(".bx--tag");
  assert(tag instanceof HTMLElement);
  return tag;
};

describe("ColorTag", () => {
  it("puts a swatch in the icon slot of a gray tag", () => {
    render(ColorTag, { props: { colorKey: "Platform" } });

    const tag = tagOf("Platform");
    expect(tag).toHaveClass("bx--tag--gray", "bx--tag--with-icon");
    expect(
      tag.querySelector(".bx--tag__custom-icon > .bx--swatch"),
    ).toHaveClass(`bx--swatch--${getAvatarBackgroundColor("Platform")}`);
  });

  it("hides the swatch, and its icon box, with hideSwatch", () => {
    render(ColorTag, { props: { colorKey: "Platform", hideSwatch: true } });

    const tag = tagOf("Platform");
    expect(tag.querySelector(".bx--swatch")).not.toBeInTheDocument();
    expect(tag.querySelector(".bx--tag__custom-icon")).not.toBeInTheDocument();
    expect(tag).not.toHaveClass("bx--tag--with-icon");
  });

  it("keeps the swatch on a filter tag and dispatches close", async () => {
    const onClose = vi.fn();
    render(ColorTag, {
      props: { colorKey: "Platform", filter: true, onClose },
    });

    expect(tagOf("Platform").querySelector(".bx--swatch")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Clear filter/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("forwards click on an interactive tag", async () => {
    const onClick = vi.fn();
    render(ColorTag, { props: { interactive: true, onClick } });

    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("leaves the swatch size to the tag, and passes the rest to Tag", () => {
    render(ColorTag, {
      props: { size: "sm", type: "blue", "data-testid": "tag" },
    });

    const tag = screen.getByTestId("tag");
    expect(tag).toHaveClass("bx--tag--sm", "bx--tag--blue");
    // The tag's size class sizes the dot in CSS, also under a TagSet.
    const swatch = tag.querySelector(".bx--swatch");
    expect(swatch).not.toHaveClass("bx--swatch--sm");
    expect(swatch).not.toHaveClass("bx--swatch--md");
  });
});
