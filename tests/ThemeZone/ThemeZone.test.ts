import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { openCalendar } from "../DatePicker/helpers";
import ThemeZoneTest from "./ThemeZone.test.svelte";
import ThemeZoneDatePickerTest from "./ThemeZoneDatePicker.test.svelte";

const portal = (testId: string) =>
  document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

describe("ThemeZone", () => {
  it("renders the theme's zone class with rest props and a custom class", () => {
    render(ThemeZoneTest);
    const zone = screen.getByTestId("zone");
    expect(zone.tagName).toBe("DIV");
    expect(zone).toHaveClass("custom", "bx--theme-zone", "bx--g100");
    expect(zone).toHaveAttribute("aria-label", "Sidebar");
  });

  it("renders the tag", () => {
    render(ThemeZoneTest, { props: { tag: "aside" } });
    expect(screen.getByTestId("zone").tagName).toBe("ASIDE");
  });

  it("follows a theme change", async () => {
    const { rerender } = render(ThemeZoneTest);
    await rerender({ theme: "g10" });
    const zone = screen.getByTestId("zone");
    expect(zone).toHaveClass("bx--g10");
    expect(zone).not.toHaveClass("bx--g100");
  });

  it("follows the system color scheme with the system theme", async () => {
    render(ThemeZoneTest, { props: { theme: "system" } });
    await tick();
    expect(screen.getByTestId("zone")).toHaveClass(
      "bx--theme-zone",
      "bx--system",
    );
    expect(portal("portal-zone")).toHaveClass("bx--system");
  });

  it("nests zones", () => {
    render(ThemeZoneTest);
    const inner = screen.getByTestId("inner-zone");
    expect(inner).toHaveClass("bx--theme-zone", "bx--white");
    expect(inner).not.toHaveClass("bx--g100");
  });

  // Carbon React's Theme resets the layer level, so a zone inside layers
  // starts a new stack.
  it("resets the layer level", () => {
    render(ThemeZoneTest);
    expect(screen.getByTestId("page-layer")).toHaveClass("bx--layer-three");
    expect(screen.getByTestId("zone-layer")).toHaveClass("bx--layer-two");
  });

  describe("portals", () => {
    it("gives portalled content the zone's theme class, not its surface", async () => {
      render(ThemeZoneTest);
      await tick();
      const inZone = portal("portal-zone");
      expect(inZone?.parentElement).toBe(document.body);
      expect(inZone).toHaveClass("custom-portal", "bx--g100");
      expect(inZone).not.toHaveClass("bx--theme-zone");
    });

    it("uses the nearest zone", async () => {
      render(ThemeZoneTest);
      await tick();
      expect(portal("portal-inner")).toHaveClass("bx--white");
      expect(portal("portal-inner")).not.toHaveClass("bx--g100");
    });

    it("adds no class outside a zone", async () => {
      render(ThemeZoneTest);
      await tick();
      expect(portal("portal-outside")).not.toHaveAttribute("class");
    });

    it("follows a zone's theme change", async () => {
      const { rerender } = render(ThemeZoneTest);
      await tick();
      await rerender({ theme: "g90", innerTheme: "g10" });
      expect(portal("portal-zone")).toHaveClass("bx--g90");
      expect(portal("portal-zone")).not.toHaveClass("bx--g100");
      expect(portal("portal-inner")).toHaveClass("bx--g10");
    });

    it("keeps a portalled ListBox menu in the zone's theme", async () => {
      render(ThemeZoneTest);
      const option = await screen.findByRole("option", { name: "eu-west-1" });
      const container = option.closest("[data-portal]");
      expect(container?.parentElement).toBe(document.body);
      expect(container).toHaveClass("bx--g100");
    });

    describe("DatePicker", () => {
      afterEach(() => {
        for (const el of document.body.querySelectorAll(
          ".bx--date-picker__calendar",
        )) {
          el.remove();
        }
      });

      it("keeps a portalled calendar in the zone's theme", async () => {
        const { rerender } = render(ThemeZoneDatePickerTest);
        const calendar = await openCalendar();
        expect(calendar.parentElement).toBe(document.body);
        expect(calendar).toHaveClass("bx--g100");
        await rerender({ theme: "white" });
        expect(calendar).toHaveClass("bx--white");
        expect(calendar).not.toHaveClass("bx--g100");
      });

      it("adds no class to a calendar that stays in the zone", async () => {
        render(ThemeZoneDatePickerTest, { props: { portalMenu: false } });
        const calendar = await openCalendar();
        expect(screen.getByLabelText("Date").closest(".bx--g100")).toBe(
          calendar.closest(".bx--g100"),
        );
        expect(calendar).not.toHaveClass("bx--g100");
      });
    });
  });
});
