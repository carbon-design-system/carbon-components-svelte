import { fireEvent, render, screen } from "@testing-library/svelte";
import ImageCompareComponent from "carbon-components-svelte/ImageCompare/ImageCompare.svelte";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import ImageCompare from "./ImageCompare.test.svelte";

const boundValue = () => screen.getByTestId("bound-value");
const slider = () => screen.getByRole("slider");

/** Gives the stage a 400 x 200 box at the origin, as jsdom has no layout. */
function sizeStage(container: HTMLElement) {
  const stage = container.querySelector(".bx--image-compare__stage");
  assert(stage);
  vi.spyOn(stage, "getBoundingClientRect").mockReturnValue(
    rect({ width: 400, height: 200 }),
  );
  return stage as HTMLElement;
}

describe("ImageCompare", () => {
  describe("divider semantics", () => {
    it("is a slider that reports the share of Before", () => {
      render(ImageCompare);

      expect(slider()).toHaveAttribute("tabindex", "0");
      expect(slider()).toHaveAttribute("aria-label", "Comparison position");
      expect(slider()).toHaveAttribute("aria-orientation", "horizontal");
      expect(slider()).toHaveAttribute("aria-valuemin", "0");
      expect(slider()).toHaveAttribute("aria-valuemax", "100");
      expect(slider()).toHaveAttribute("aria-valuenow", "50");
      expect(slider()).toHaveAttribute(
        "aria-valuetext",
        "Showing 50% of Before",
      );
    });

    it("writes the position as a custom property, so the static frame needs no script", () => {
      const { container } = render(ImageCompare, { props: { value: 30 } });

      expect(
        container.querySelector<HTMLElement>(".bx--image-compare__stage")?.style
          .cssText,
      ).toContain("--ccs-image-compare-position: 30");
    });

    it("names the value with the labels and lets formatValueText replace it", async () => {
      const { rerender } = render(ImageCompareComponent, {
        props: { value: 40, beforeLabel: "Original", afterLabel: "Edited" },
      });
      expect(slider()).toHaveAttribute(
        "aria-valuetext",
        "Showing 40% of Original",
      );

      await rerender({ formatValueText: (v: number) => `${v} sur 100` });
      expect(slider()).toHaveAttribute("aria-valuetext", "40 sur 100");
    });

    it("clamps a value outside 0 to 100 and ignores NaN", async () => {
      const { rerender } = render(ImageCompareComponent, {
        props: { value: 140 },
      });
      expect(slider()).toHaveAttribute("aria-valuenow", "100");

      await rerender({ value: -5 });
      expect(slider()).toHaveAttribute("aria-valuenow", "0");

      await rerender({ value: Number.NaN });
      expect(slider()).toHaveAttribute("aria-valuenow", "50");
    });

    it("is vertical when the orientation is", () => {
      render(ImageCompare, { props: { orientation: "vertical" } });

      expect(slider()).toHaveAttribute("aria-orientation", "vertical");
    });
  });

  describe("keyboard", () => {
    it.each([
      { keys: "{ArrowRight}", expected: "51" },
      { keys: "{ArrowLeft}", expected: "49" },
      { keys: "{ArrowUp}", expected: "51" },
      { keys: "{ArrowDown}", expected: "49" },
      { keys: "{Shift>}{ArrowRight}{/Shift}", expected: "60" },
      { keys: "{PageUp}", expected: "60" },
      { keys: "{PageDown}", expected: "40" },
      { keys: "{Home}", expected: "0" },
      { keys: "{End}", expected: "100" },
    ])("$keys moves the divider to $expected", async ({ keys, expected }) => {
      render(ImageCompare);
      slider().focus();

      await user.keyboard(keys);

      expect(boundValue()).toHaveTextContent(expected);
      expect(slider()).toHaveAttribute("aria-valuenow", expected);
    });

    it("stops at the ends", async () => {
      render(ImageCompare, { props: { value: 99 } });
      slider().focus();

      await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(boundValue()).toHaveTextContent("100");

      await user.keyboard("{Home}{ArrowLeft}");
      expect(boundValue()).toHaveTextContent("0");
    });

    it("moves a vertical divider the way the arrow points, and aliases the other axis", async () => {
      render(ImageCompare, { props: { orientation: "vertical" } });
      slider().focus();

      await user.keyboard("{ArrowDown}");
      expect(boundValue()).toHaveTextContent("51");
      await user.keyboard("{ArrowUp}{ArrowUp}");
      expect(boundValue()).toHaveTextContent("49");
      await user.keyboard("{ArrowRight}");
      expect(boundValue()).toHaveTextContent("50");
    });

    it("swaps Left and Right in RTL, where Before sits on the right", async () => {
      const { container } = render(ImageCompare);
      container.setAttribute("dir", "rtl");
      slider().focus();

      await user.keyboard("{ArrowLeft}");
      expect(boundValue()).toHaveTextContent("51");
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(boundValue()).toHaveTextContent("49");
    });

    it("leaves Alt, Ctrl and Meta arrows to the browser", async () => {
      render(ImageCompare);
      slider().focus();

      await user.keyboard("{Alt>}{ArrowRight}{/Alt}");

      expect(boundValue()).toHaveTextContent("50");
    });

    it("honors step and largeStep", async () => {
      render(ImageCompareComponent, { props: { step: 5, largeStep: 25 } });
      slider().focus();

      await user.keyboard("{ArrowRight}");
      expect(slider()).toHaveAttribute("aria-valuenow", "55");
      await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(slider()).toHaveAttribute("aria-valuenow", "80");
    });
  });

  describe("pointer", () => {
    it("jumps to the pressed point and follows the drag", async () => {
      const onChange = vi.fn();
      const { container } = render(ImageCompare, { props: { onChange } });
      const stage = sizeStage(container);

      await fireEvent.pointerDown(stage, {
        clientX: 100,
        pointerId: 1,
        pointerType: "mouse",
      });
      expect(boundValue()).toHaveTextContent("25");
      expect(slider()).toHaveFocus();

      await fireEvent.pointerMove(stage, { clientX: 300, pointerId: 1 });
      expect(boundValue()).toHaveTextContent("75");
      expect(onChange).toHaveBeenLastCalledWith(75);

      await fireEvent.pointerUp(stage, { pointerId: 1 });
      await fireEvent.pointerMove(stage, { clientX: 40, pointerId: 1 });
      expect(boundValue()).toHaveTextContent("75");
    });

    it("clamps a drag that leaves the frame", async () => {
      const { container } = render(ImageCompare);
      const stage = sizeStage(container);

      await fireEvent.pointerDown(stage, {
        clientX: 200,
        pointerId: 1,
        pointerType: "mouse",
      });
      await fireEvent.pointerMove(stage, { clientX: 900, pointerId: 1 });
      expect(boundValue()).toHaveTextContent("100");
      await fireEvent.pointerMove(stage, { clientX: -50, pointerId: 1 });
      expect(boundValue()).toHaveTextContent("0");
    });

    it("measures from the right in RTL", async () => {
      const { container } = render(ImageCompare);
      container.setAttribute("dir", "rtl");
      const stage = sizeStage(container);

      await fireEvent.pointerDown(stage, {
        clientX: 100,
        pointerId: 1,
        pointerType: "mouse",
      });

      expect(boundValue()).toHaveTextContent("75");
    });

    it("measures from the top when vertical", async () => {
      const { container } = render(ImageCompare, {
        props: { orientation: "vertical" },
      });
      const stage = sizeStage(container);

      await fireEvent.pointerDown(stage, {
        clientY: 50,
        pointerId: 1,
        pointerType: "pen",
      });

      expect(boundValue()).toHaveTextContent("25");
    });

    it("does not jump on a touch press, which may start a page scroll", async () => {
      const { container } = render(ImageCompare);
      const stage = sizeStage(container);

      await fireEvent.pointerDown(stage, {
        clientX: 100,
        clientY: 50,
        pointerId: 1,
        pointerType: "touch",
      });
      await fireEvent.pointerCancel(stage, { pointerId: 1 });

      expect(boundValue()).toHaveTextContent("50");
    });

    it("drags with a touch once it moves past the slop", async () => {
      const { container } = render(ImageCompare);
      const stage = sizeStage(container);

      await fireEvent.pointerDown(stage, {
        clientX: 200,
        clientY: 50,
        pointerId: 1,
        pointerType: "touch",
      });
      await fireEvent.pointerMove(stage, {
        clientX: 203,
        clientY: 50,
        pointerId: 1,
      });
      expect(boundValue()).toHaveTextContent("50");

      await fireEvent.pointerMove(stage, {
        clientX: 300,
        clientY: 50,
        pointerId: 1,
      });
      expect(boundValue()).toHaveTextContent("75");
      await fireEvent.pointerUp(stage, { clientX: 300, pointerId: 1 });
      expect(boundValue()).toHaveTextContent("75");
    });

    it("jumps to a touch tap on release", async () => {
      const { container } = render(ImageCompare);
      const stage = sizeStage(container);

      await fireEvent.pointerDown(stage, {
        clientX: 100,
        clientY: 50,
        pointerId: 1,
        pointerType: "touch",
      });
      await fireEvent.pointerUp(stage, {
        clientX: 100,
        clientY: 50,
        pointerId: 1,
      });

      expect(boundValue()).toHaveTextContent("25");
    });

    it("ignores the pointer outside slider mode", async () => {
      const { container } = render(ImageCompare, {
        props: { mode: "toggle" },
      });
      const stage = sizeStage(container);

      await fireEvent.pointerDown(stage, {
        clientX: 100,
        pointerId: 1,
        pointerType: "mouse",
      });

      expect(boundValue()).toHaveTextContent("50");
    });
  });

  describe("labels and images", () => {
    it("shows Before and After as text", () => {
      render(ImageCompare);

      expect(screen.getByText("Before")).toBeVisible();
      expect(screen.getByText("After")).toBeVisible();
    });

    it("hides the labels but keeps the names in the value text", () => {
      render(ImageCompareComponent, { props: { hideLabels: true } });

      expect(screen.queryByText("Before")).not.toBeInTheDocument();
      expect(slider()).toHaveAttribute(
        "aria-valuetext",
        "Showing 50% of Before",
      );
    });

    it("gives each image its own alt, defaulting to its label", () => {
      render(ImageCompareComponent, {
        props: {
          beforeSrc: "a.png",
          afterSrc: "b.png",
          afterAlt: "Sharper edges, no noise",
        },
      });

      expect(screen.getByAltText("Before")).toHaveAttribute("src", "a.png");
      expect(screen.getByAltText("Sharper edges, no noise")).toHaveAttribute(
        "src",
        "b.png",
      );
    });

    it("fits both images into the frame with the chosen object-fit", () => {
      const { container } = render(ImageCompareComponent, {
        props: { beforeSrc: "a.png", afterSrc: "b.png", fit: "contain" },
      });

      for (const img of container.querySelectorAll("img")) {
        expect(img.style.objectFit).toBe("contain");
      }
    });

    it("renders slot content in place of the image props", () => {
      render(ImageCompare, { props: { slots: true } });

      expect(screen.getByTestId("before-slot")).toBeInTheDocument();
      expect(screen.getByTestId("after-slot")).toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("names the group from labelText and forwards rest props to it", () => {
      render(ImageCompareComponent, {
        props: { labelText: "Denoised photo", "data-testid": "root" },
      });

      expect(screen.getByRole("group", { name: "Denoised photo" })).toBe(
        screen.getByTestId("root"),
      );
    });
  });

  describe("modes", () => {
    it("side-by-side shows both sides with captions and no divider", () => {
      render(ImageCompare, { props: { mode: "side-by-side" } });

      expect(screen.queryByRole("slider")).not.toBeInTheDocument();
      expect(screen.getAllByRole("figure")).toHaveLength(2);
      expect(screen.getByText("Before").tagName).toBe("FIGCAPTION");
      expect(screen.getByText("After").tagName).toBe("FIGCAPTION");
    });

    it("toggle switches the visible side and hides the other from assistive tech", async () => {
      const { container } = render(ImageCompare, {
        props: { mode: "toggle", slots: true },
      });
      const before = container.querySelector(
        ".bx--image-compare__layer--before",
      );
      const after = container.querySelector(".bx--image-compare__layer--after");

      expect(screen.queryByRole("slider")).not.toBeInTheDocument();
      expect(screen.getByRole("tablist")).toHaveAttribute(
        "aria-label",
        "Comparison view",
      );
      expect(after).toHaveAttribute("aria-hidden", "true");
      expect(before).not.toHaveAttribute("aria-hidden");
      expect(before).not.toHaveClass("bx--image-compare__layer--off");

      await user.click(screen.getByRole("tab", { name: "After" }));

      expect(screen.getByTestId("bound-selected")).toHaveTextContent("after");
      expect(before).toHaveAttribute("aria-hidden", "true");
      expect(before).toHaveClass("bx--image-compare__layer--off");
      expect(after).not.toHaveAttribute("aria-hidden");
    });

    it("toggle follows the bound selected prop", async () => {
      const { rerender } = render(ImageCompare, {
        props: { mode: "toggle", selected: "after" },
      });
      expect(screen.getByRole("tab", { name: "After" })).toHaveAttribute(
        "aria-selected",
        "true",
      );

      await rerender({ selected: "before" });
      expect(screen.getByRole("tab", { name: "Before" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });
});
