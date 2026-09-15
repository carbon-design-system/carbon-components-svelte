import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { expectInlineStyle } from "../utils/inline-style";
import TagMaxWidth from "./TagMaxWidth.test.svelte";

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

  it("exposes the full label via title on a truncated interactive tag", async () => {
    mockOverflow(true);
    render(TagMaxWidth, {
      props: { maxWidth: "8rem", label, interactive: true },
    });
    await tick();
    await tick();

    const tag = screen.getByText(label).closest(".bx--tag");
    expect(tag).toHaveAttribute("title", label);
    expect(
      document.querySelector(".bx--tooltip--definition"),
    ).not.toBeInTheDocument();
  });

  it("does not set a title on an interactive tag that is not truncated", async () => {
    mockOverflow(false);
    render(TagMaxWidth, {
      props: { maxWidth: "8rem", label: "Short", interactive: true },
    });
    await tick();

    const tag = screen.getByText("Short").closest(".bx--tag");
    expect(tag).not.toHaveAttribute("title");
  });

  it("applies the truncate class, max-width style, and title on a truncated link tag", async () => {
    mockOverflow(true);
    render(TagMaxWidth, {
      props: { maxWidth: "8rem", label, href: "https://example.com" },
    });
    await tick();
    await tick();

    const tag = screen.getByText(label).closest(".bx--tag");
    expect(tag).toHaveClass("bx--tag--truncate");
    expectInlineStyle(tag, { maxWidth: "8rem" });
    expect(tag).toHaveAttribute("title", label);
    expect(
      document.querySelector(".bx--tooltip--definition"),
    ).not.toBeInTheDocument();
  });

  it("does not set a title on a link tag that is not truncated", async () => {
    mockOverflow(false);
    render(TagMaxWidth, {
      props: { maxWidth: "8rem", label: "Short", href: "https://example.com" },
    });
    await tick();

    const tag = screen.getByText("Short").closest(".bx--tag");
    expect(tag).not.toHaveAttribute("title");
  });

  it("renders a tooltip when a non-interactive label overflows", async () => {
    mockOverflow(true);
    render(TagMaxWidth, { props: { maxWidth: "8rem", label } });
    await tick();
    await tick();

    const tooltip = document.querySelector(".bx--tooltip--definition");
    expect(tooltip).toBeInTheDocument();
    expect(
      tooltip?.querySelector(".bx--tooltip__trigger")?.textContent?.trim(),
    ).toBe(label);
  });
});
