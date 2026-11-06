import { render, screen } from "@testing-library/svelte";
import { encodeQR } from "../../src/QRCode/qr-encode.js";
import { user } from "../utils/user";
import QRCode from "./QRCode.test.svelte";
import { decodeGrid } from "./decoder";
import { gridFromSvg } from "./svg-grid";

const svgOf = () => screen.getByRole("img");

describe("QRCode", () => {
  const writeText = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const portal of document.querySelectorAll("[data-floating-portal]")) {
      portal.remove();
    }
  });

  it("renders one image whose path is a symbol that decodes to the value", () => {
    render(QRCode, { value: "https://example.com/a?b=c" });

    const svg = svgOf();
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.querySelectorAll("path")).toHaveLength(1);
    const decoded = decodeGrid(gridFromSvg(svg.outerHTML));
    expect(decoded.text).toBe("https://example.com/a?b=c");
    expect(decoded.ecc).toBe("M");
  });

  it("sizes the code and adds the quiet zone to the viewBox", () => {
    render(QRCode, { value: "a", extra: { size: 240, quietZone: 2 } });

    // Version 1 is 21 modules.
    expect(svgOf()).toHaveAttribute("viewBox", "0 0 25 25");
    expect(svgOf()).toHaveAttribute("width", "240");
    expect(svgOf()).toHaveAttribute("height", "240");
  });

  it("encodes at the chosen error correction level", () => {
    render(QRCode, { value: "hello", ecc: "Q" });

    expect(decodeGrid(gridFromSvg(svgOf().outerHTML)).ecc).toBe("Q");
  });

  describe("text alternative", () => {
    it("labels the image by purpose and describes it with the text", () => {
      render(QRCode, {
        value: "JBSWY3DPEHPK3PXP",
        extra: { labelText: "Scan to set up two-factor authentication" },
      });

      expect(svgOf()).toHaveAccessibleName(
        "Scan to set up two-factor authentication",
      );
      expect(svgOf()).toHaveAccessibleDescription("JBSWY3DPEHPK3PXP");
    });

    it("copies the text, not the grouped display", async () => {
      render(QRCode, { value: "otpauth://x", text: "jbswy3dp", grouped: true });

      expect(screen.getByText("JBSWY3DP")).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: "Copy to clipboard" }),
      );

      expect(writeText).toHaveBeenCalledWith("jbswy3dp");
    });

    it("tucks the text behind a disclosure", async () => {
      render(QRCode, { value: "KEY", alternative: "disclosure" });

      const toggle = screen.getByRole("button", {
        name: "Can't scan? Copy the text instead",
      });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      await user.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(svgOf()).toHaveAccessibleDescription("KEY");
    });

    it("leaves the text to the caller with alternative none", () => {
      render(QRCode, { value: "KEY", alternative: "none" });

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(svgOf()).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("input that cannot be drawn", () => {
    it("renders nothing for an empty value", () => {
      render(QRCode, { value: "" });

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("warns and keeps the text when the value is too long", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(QRCode, { value: "a".repeat(3000), ecc: "L" });

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("too long"));
      expect(
        screen.getByRole("button", { name: "Copy to clipboard" }),
      ).toBeInTheDocument();
    });
  });

  describe("logo", () => {
    it("defaults to ecc H, clears the modules behind it, and still decodes", () => {
      const value = "otpauth://totp/Acme:a?secret=JBSWY3DPEHPK3PXP";
      render(QRCode, { value, logo: true });

      expect(screen.getByTestId("logo")).toBeInTheDocument();
      const clean = encodeQR(value, "H");
      const cleanGrid = Array.from({ length: clean.size }, (_, y) =>
        Array.from(clean.modules.slice(y * clean.size, (y + 1) * clean.size)),
      );
      const grid = gridFromSvg(svgOf().outerHTML);
      expect(grid).not.toEqual(cleanGrid);
      // The cleared center is only recoverable through error correction.
      const decoded = decodeGrid(grid, {
        structure: decodeGrid(cleanGrid).structure,
      });
      expect(decoded.ecc).toBe("H");
      expect(decoded.text).toBe(value);
      expect(decoded.corrected).toBeGreaterThan(0);
    });

    it("warns when the level cannot cover a logo", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(QRCode, { value: "hello", ecc: "M", logo: true });

      await vi.waitFor(() =>
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('ecc="H"')),
      );
    });

    it("does not warn at the default level", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(QRCode, { value: "hello", logo: true });
      await Promise.resolve();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  it("passes rest props to the root", () => {
    render(QRCode, { value: "a", extra: { "data-extra": "yes" } });

    expect(screen.getByTestId("qr")).toHaveAttribute("data-extra", "yes");
    expect(screen.getByTestId("qr")).toHaveClass("bx--qr-code");
  });
});
