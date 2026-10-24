import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import CarouselDirection from "./CarouselDirection.test.svelte";

/** Focus the "Next slide" button, then press `key`. */
async function press(key: string) {
  screen.getByRole("button", { name: "Next slide" }).focus();
  await user.keyboard(`{${key}}`);
}

const selected = () => screen.getByTestId("selected-index");

describe("Carousel writing direction", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("direction");
  });

  it.each([
    ["ArrowLeft", "2"],
    ["ArrowRight", "0"],
  ])("moves %s toward slide %s in RTL", async (key, index) => {
    render(CarouselDirection);

    await press(key);
    expect(selected()).toHaveTextContent(index);
  });

  it("lets a LayoutDirection win over the computed direction", async () => {
    document.documentElement.style.direction = "rtl";
    render(CarouselDirection, { props: { dir: "ltr" } });

    await press("ArrowRight");
    expect(selected()).toHaveTextContent("2");
  });

  it("reads a page direction change on the next key", async () => {
    render(CarouselDirection, { props: { context: false } });

    await press("ArrowRight");
    expect(selected()).toHaveTextContent("2");

    document.documentElement.style.direction = "rtl";
    await press("ArrowRight");
    expect(selected()).toHaveTextContent("1");
  });
});
