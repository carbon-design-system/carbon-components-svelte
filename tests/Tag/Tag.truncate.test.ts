import { render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { expectInlineStyle } from "../utils/inline-style";
import { openTooltips } from "../utils/open-tooltips";
import TagTruncation from "./TagTruncation.test.svelte";

type Props = ComponentProps<TagTruncation>;

describe("Tag truncation", () => {
  let clientWidthSpy: ReturnType<typeof vi.spyOn>;
  let scrollWidthSpy: ReturnType<typeof vi.spyOn>;

  function mockOverflow(truncated: boolean) {
    clientWidthSpy = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(truncated ? 40 : 200);
    scrollWidthSpy = vi
      .spyOn(HTMLElement.prototype, "scrollWidth", "get")
      .mockReturnValue(truncated ? 200 : 40);
  }

  afterEach(() => {
    clientWidthSpy?.mockRestore();
    scrollWidthSpy?.mockRestore();
  });

  const label =
    "status:active AND region:us-south AND service:cloud-object-storage";

  // The label is measured once the shared ResizeObserver reports it.
  async function renderTag(props: Props) {
    const result = render(TagTruncation, { props: { label, ...props } });
    await flushMacrotask();
    await tick();
    return result;
  }

  const tagOf = (text: string) => screen.getByText(text).closest(".bx--tag");

  const hosts: [string, Props, () => HTMLElement][] = [
    [
      "interactive tag",
      { interactive: true },
      () => screen.getByRole("button"),
    ],
    [
      "link tag",
      { href: "https://example.com" },
      () => screen.getByRole("link"),
    ],
    [
      "OperationalTag",
      { kind: "operational" },
      () => screen.getByRole("button"),
    ],
    ["SelectableTag", { kind: "selectable" }, () => screen.getByRole("button")],
  ];

  it.each([
    ["static tag", {}],
    ["filter tag", { filter: true }],
  ])(
    "wraps a truncated %s label in a definition tooltip by default",
    async (_, props) => {
      mockOverflow(true);
      await renderTag(props);

      const tooltip = document.querySelector(".bx--tooltip--definition");
      expect(tooltip).toBeInTheDocument();
      expect(
        tooltip?.querySelector(".bx--tooltip__trigger")?.textContent?.trim(),
      ).toBe(label);
      expect(tagOf(label)).not.toHaveClass("bx--tag--truncate");
      expect(tagOf(label)).not.toHaveAttribute("title");
    },
  );

  it.each(hosts)(
    "shows a truncated %s label in a tooltip on focus",
    async (_, props, host) => {
      mockOverflow(true);
      await renderTag(props);

      expect(host()).not.toHaveAttribute("title");
      expect(openTooltips()).toHaveLength(0);

      host().focus();
      await tick();

      expect(openTooltips().map((tooltip) => tooltip.textContent)).toEqual([
        label,
      ]);
    },
  );

  it.each([
    ["static tag", {}, null],
    ["filter tag", { filter: true }, null],
    ...hosts,
  ] as [string, Props, (() => HTMLElement) | null][])(
    "shows no tooltip or title when a %s label fits",
    async (_, props, host) => {
      mockOverflow(false);
      await renderTag({ ...props, label: "Short" });

      expect(
        document.querySelector(".bx--tooltip--definition"),
      ).not.toBeInTheDocument();
      expect(tagOf("Short")).not.toHaveAttribute("title");
      if (host) {
        host().focus();
        await tick();
        expect(openTooltips()).toHaveLength(0);
      }
    },
  );

  it.each([
    ["interactive tag", { interactive: true }],
    ["link tag", { href: "https://example.com" }],
    ["OperationalTag", { kind: "operational" }],
    ["SelectableTag", { kind: "selectable" }],
  ] as [string, Props][])(
    "falls back to title on a disabled, truncated %s",
    async (_, props) => {
      mockOverflow(true);
      await renderTag({ ...props, disabled: true });

      expect(tagOf(label)).toHaveAttribute("title", label);
    },
  );

  it("keeps an OperationalTag's tooltip closed while its popover is open", async () => {
    mockOverflow(true);
    await renderTag({ kind: "operational", open: true });

    screen.getByRole("button", { name: label }).focus();
    await tick();

    expect(openTooltips()).toHaveLength(0);
  });

  it.each([
    ["static tag", {}],
    ["filter tag", { filter: true }],
    ["link tag", { href: "https://example.com" }],
  ])(
    "applies the truncate class and max-width style to a %s",
    async (_, props) => {
      mockOverflow(false);
      await renderTag({ ...props, maxWidth: "8rem", label: "Short" });

      const tag = tagOf("Short");
      expect(tag).toHaveClass("bx--tag--truncate");
      expectInlineStyle(tag, { maxWidth: "8rem" });
    },
  );

  it("uses a native title, not a focusable tooltip, inside a roving TagSet", async () => {
    mockOverflow(true);
    await renderTag({ filter: true, roving: true });

    const tag = tagOf(label);
    expect(tag).toHaveAttribute("title", label);
    expect(tag?.querySelector(".bx--tag__label-tooltip")).toBeNull();
  });
});
