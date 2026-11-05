import { render, screen, within } from "@testing-library/svelte";
import { openCalendar } from "../DatePicker/helpers";
import Adoption from "./Adoption.test.svelte";

const numberInput = () => screen.getByLabelText("Amount") as HTMLInputElement;
const sortedNames = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent?.trim());
const weekdays = (container: HTMLElement) =>
  Array.from(container.querySelectorAll(".bx--date-picker__weekday")).map(
    (node) => node.textContent?.trim(),
  );

describe("components under a LocaleProvider", () => {
  describe("NumberInput", () => {
    it("formats with the provider's locale and follows a change", async () => {
      const { rerender } = render(Adoption, {
        provider: { locale: "de-DE" },
      });
      expect(numberInput()).toHaveValue("1.234,5");

      await rerender({ provider: { locale: "en-US" } });
      expect(numberInput()).toHaveValue("1,234.5");
    });

    it("keeps its own locale over the provider's", () => {
      render(Adoption, {
        provider: { locale: "de-DE" },
        own: { numberInput: { locale: "en-US" } },
      });
      expect(numberInput()).toHaveValue("1,234.5");
    });

    it("writes the digits of the provider's numbering system", () => {
      render(Adoption, {
        provider: { locale: "ar-EG", numberingSystem: "latn" },
      });
      expect(numberInput().value).toMatch(/^1.234.5$/);
      expect(numberInput().value).not.toMatch(/[٠-٩]/);
    });

    it("stays a native number input outside a provider", () => {
      render(Adoption);
      expect(numberInput()).toHaveAttribute("type", "number");
    });
  });

  describe("RelativeTime", () => {
    it("uses the provider's locale for the text and its zone for the title", () => {
      render(Adoption, {
        provider: { locale: "de-DE", timeZone: "Asia/Tokyo" },
      });
      const time = screen.getByTestId("time");
      expect(time).toHaveTextContent("vor 5 Minuten");
      expect(time.getAttribute("title")?.replace(/\s/g, " ")).toBe(
        "13.09.2026, 20:55",
      );
    });

    it("writes the title on the provider's hour cycle", () => {
      render(Adoption, {
        provider: { locale: "en-US", timeZone: "UTC", hourCycle: "h23" },
      });
      expect(screen.getByTestId("time").getAttribute("title")).toBe(
        "Sep 13, 2026, 11:55",
      );
    });

    it("keeps its own time zone over the provider's, and title options over both", () => {
      const { unmount } = render(Adoption, {
        provider: { locale: "en-US", timeZone: "Asia/Tokyo" },
        own: { relativeTime: { timeZone: "UTC" } },
      });
      expect(
        screen.getByTestId("time").getAttribute("title")?.replace(/\s/g, " "),
      ).toBe("Sep 13, 2026, 11:55 AM");
      unmount();

      render(Adoption, {
        provider: { locale: "en-US", timeZone: "Asia/Tokyo" },
        own: {
          relativeTime: {
            titleFormatOptions: {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "UTC",
            },
          },
        },
      });
      expect(
        screen.getByTestId("time").getAttribute("title")?.replace(/\s/g, " "),
      ).toBe("Sep 13, 2026, 11:55 AM");
    });
  });

  describe("Pagination", () => {
    it("writes its numbers in the provider's locale", async () => {
      const { rerender } = render(Adoption, { provider: { locale: "de-DE" } });
      expect(screen.getByText("1–10 of 12.345 items")).toBeInTheDocument();

      await rerender({ provider: { locale: "en-US" } });
      expect(screen.getByText("1–10 of 12,345 items")).toBeInTheDocument();
    });

    it("keeps its own locale over the provider's", () => {
      render(Adoption, {
        provider: { locale: "de-DE" },
        own: { pagination: { locale: "en-US" } },
      });
      expect(screen.getByText("1–10 of 12,345 items")).toBeInTheDocument();
    });

    it("hands a custom text function the formatter", () => {
      render(Adoption, {
        provider: { locale: "de-DE" },
        own: {
          pagination: {
            itemRangeText: (_min, _max, total, format) =>
              `${format(total)} Elemente`,
          },
        },
      });
      expect(screen.getByText("12.345 Elemente")).toBeInTheDocument();
    });
  });

  describe("DataTable", () => {
    it("sorts with the provider's collation", async () => {
      const { rerender } = render(Adoption, { provider: { locale: "sv" } });
      expect(sortedNames()).toEqual(["a", "z", "ä"]);

      // German sorts "ä" with "a", which `sensitivity: "base"` ties, so the
      // rows that tie keep their order.
      await rerender({ provider: { locale: "de" } });
      expect(sortedNames()).toEqual(["ä", "a", "z"]);
    });

    it("keeps its own locale over the provider's", () => {
      render(Adoption, {
        provider: { locale: "de" },
        own: { dataTable: { locale: "sv" } },
      });
      expect(sortedNames()).toEqual(["a", "z", "ä"]);
    });
  });

  describe("FileUploader", () => {
    it("writes the size with the provider's decimal separator", () => {
      render(Adoption, { provider: { locale: "de-DE" } });
      expect(screen.getByText("1,5 kB")).toBeInTheDocument();
    });

    it("keeps its own locale, and a point outside a provider", () => {
      const { unmount } = render(Adoption, {
        provider: { locale: "de-DE" },
        own: { fileUploader: { locale: "en-US" } },
      });
      expect(screen.getByText("1.5 kB")).toBeInTheDocument();
      unmount();

      render(Adoption);
      expect(screen.getByText("1.5 kB")).toBeInTheDocument();
    });
  });

  describe("DatePicker", () => {
    it("names the weekdays and starts the week as the provider's locale does", async () => {
      const { container } = render(Adoption, {
        provider: { locale: "de-DE" },
      });
      await openCalendar();
      expect(weekdays(container)).toEqual([
        "Mo",
        "Di",
        "Mi",
        "Do",
        "Fr",
        "Sa",
        "So",
      ]);
    });

    it("starts the week on the provider's weekStart", async () => {
      const { container } = render(Adoption, {
        provider: { locale: "de-DE", weekStart: 0 },
      });
      await openCalendar();
      expect(weekdays(container)[0]).toBe("So");
    });

    it("keeps its own locale and first day over the provider's", async () => {
      const { container } = render(Adoption, {
        provider: { locale: "de-DE", weekStart: 0 },
        own: { datePicker: { locale: "en", firstDayOfWeek: 6 } },
      });
      await openCalendar();
      expect(weekdays(container)).toEqual(["S", "S", "M", "T", "W", "Th", "F"]);
    });
  });
});
