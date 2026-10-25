import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { openCalendar } from "../DatePicker/helpers";
import LayoutDirectionPlain from "./LayoutDirection.plain.test.svelte";
import LayoutDirectionTest from "./LayoutDirection.test.svelte";

const portal = (testId: string) =>
  document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

describe("LayoutDirection", () => {
  it("renders the element with dir, rest props, and a custom class", () => {
    render(LayoutDirectionTest);
    const outer = screen.getByTestId("outer");
    expect(outer.tagName).toBe("DIV");
    expect(outer).toHaveAttribute("dir", "rtl");
    expect(outer).toHaveClass("custom");
  });

  it("renders the tag", () => {
    render(LayoutDirectionTest, { props: { tag: "section" } });
    expect(screen.getByTestId("outer").tagName).toBe("SECTION");
  });

  it("gives children the nearest direction through context", () => {
    render(LayoutDirectionTest);
    expect(screen.getByTestId("probe-outside")).toHaveTextContent("none");
    expect(screen.getByTestId("probe-outer")).toHaveTextContent("rtl");
    expect(screen.getByTestId("probe-inner")).toHaveTextContent("ltr");
    expect(screen.getByTestId("inner")).toHaveAttribute("dir", "ltr");
  });

  it("follows a dir change", async () => {
    const { rerender } = render(LayoutDirectionTest);
    await rerender({ dir: "ltr", innerDir: "rtl" });
    expect(screen.getByTestId("outer")).toHaveAttribute("dir", "ltr");
    expect(screen.getByTestId("probe-outer")).toHaveTextContent("ltr");
    expect(screen.getByTestId("probe-inner")).toHaveTextContent("rtl");
  });

  describe("portals", () => {
    afterEach(() => {
      for (const el of document.body.querySelectorAll(
        ".bx--date-picker__calendar",
      )) {
        el.remove();
      }
    });

    it("gives portalled content the nearest direction", async () => {
      render(LayoutDirectionTest);
      await tick();
      expect(portal("portal-outer")?.parentElement).toBe(document.body);
      expect(portal("portal-outer")).toHaveAttribute("dir", "rtl");
      expect(portal("portal-inner")).toHaveAttribute("dir", "ltr");
    });

    it("gives a bare Portal the direction", async () => {
      render(LayoutDirectionTest);
      await tick();
      const bare = portal("bare-outer");
      expect(bare?.parentElement).toBe(document.body);
      expect(bare).toHaveAttribute("dir", "rtl");
      expect(bare).toHaveClass("custom-portal");
    });

    it.each(["portal-outside", "bare-outside"])(
      "adds no dir outside a LayoutDirection (%s)",
      async (testId) => {
        render(LayoutDirectionTest);
        await tick();
        expect(portal(testId)).not.toHaveAttribute("dir");
      },
    );

    it.each(["portal-override", "bare-override"])(
      "keeps a dir set on the portal (%s)",
      async (testId) => {
        render(LayoutDirectionTest);
        await tick();
        expect(portal(testId)).toHaveAttribute("dir", "ltr");
      },
    );

    it.each([
      ["zone-in-direction", "bx--g100"],
      ["direction-in-zone", "bx--g10"],
    ])("gives %s both the zone class and dir", async (testId, zoneClass) => {
      render(LayoutDirectionTest);
      await tick();
      expect(portal(testId)?.parentElement).toBe(document.body);
      expect(portal(testId)).toHaveClass(zoneClass);
      expect(portal(testId)).toHaveAttribute("dir", "rtl");
    });

    it("follows a dir change", async () => {
      const { rerender } = render(LayoutDirectionTest);
      await tick();
      await rerender({ dir: "ltr", innerDir: "rtl" });
      expect(portal("portal-outer")).toHaveAttribute("dir", "ltr");
      expect(portal("portal-inner")).toHaveAttribute("dir", "rtl");
    });

    it("keeps a portalled ListBox menu in the direction", async () => {
      render(LayoutDirectionTest);
      const option = await screen.findByRole("option", { name: "eu-west-1" });
      const container = option.closest("[data-portal]");
      expect(container?.parentElement).toBe(document.body);
      expect(container).toHaveAttribute("dir", "rtl");
    });

    describe("with a plain dir inside", () => {
      it.each([
        ["rtl", "ltr"],
        ["ltr", "rtl"],
      ] as const)(
        "in a %s one, portals take the plain %s",
        async (dir, plainDir) => {
          render(LayoutDirectionPlain, { props: { dir, plainDir } });
          const option = await screen.findByRole("option", {
            name: "eu-west-1",
          });
          for (const container of [
            portal("bare-plain"),
            portal("floating-plain"),
            option.closest("[data-portal]"),
          ]) {
            expect(container?.parentElement).toBe(document.body);
            expect(container).toHaveAttribute("dir", plainDir);
          }
        },
      );

      it("reads the plain dir again when the LayoutDirection changes", async () => {
        const { rerender } = render(LayoutDirectionPlain, {
          props: { datePicker: true },
        });
        const calendar = await openCalendar();
        expect(calendar).toHaveAttribute("dir", "ltr");
        await rerender({ dir: "ltr", plainDir: "rtl" });
        await tick();
        expect(portal("bare-plain")).toHaveAttribute("dir", "rtl");
        expect(portal("floating-plain")).toHaveAttribute("dir", "rtl");
        expect(calendar).toHaveAttribute("dir", "rtl");
      });

      it("takes a plain dir outside any LayoutDirection", async () => {
        render(LayoutDirectionPlain);
        await tick();
        expect(portal("bare-no-context")?.parentElement).toBe(document.body);
        expect(portal("bare-no-context")).toHaveAttribute("dir", "rtl");
      });
    });

    describe("DatePicker", () => {
      it("keeps a portalled calendar in the direction", async () => {
        const { rerender } = render(LayoutDirectionTest, {
          props: { datePicker: true },
        });
        const calendar = await openCalendar();
        expect(calendar.parentElement).toBe(document.body);
        expect(calendar).toHaveAttribute("dir", "rtl");
        await rerender({ dir: "ltr" });
        expect(calendar).toHaveAttribute("dir", "ltr");
      });

      it.each([
        ["rtl", "ltr"],
        ["ltr", "rtl"],
      ] as const)(
        "lets a plain dir win in a %s one (%s)",
        async (dir, plainDir) => {
          render(LayoutDirectionPlain, {
            props: { dir, plainDir, datePicker: true },
          });
          const calendar = await openCalendar();
          expect(calendar.parentElement).toBe(document.body);
          expect(calendar).toHaveAttribute("dir", plainDir);
        },
      );

      it("adds no dir to a calendar that stays in the subtree", async () => {
        render(LayoutDirectionTest, {
          props: { datePicker: true, portalMenu: false },
        });
        const calendar = await openCalendar();
        expect(calendar.closest("[dir]")).toBe(screen.getByTestId("outer"));
      });
    });
  });
});
