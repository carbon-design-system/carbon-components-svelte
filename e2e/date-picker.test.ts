import { expect, test } from "@playwright/test";

test.describe("DatePicker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/date-picker.html");
  });

  test("renders with placeholder", async ({ page }) => {
    await expect(
      page.getByTestId("date-picker-single").getByPlaceholder("mm/dd/yyyy"),
    ).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const input = page.getByLabel("Meeting date");
    await expect(input).toBeVisible();
    await input.fill("03/10/2023");
    await expect(input).toHaveValue("03/10/2023");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const input = page.getByTestId("date-picker-meeting");
    await expect(input).toBeVisible();
    await input.click();
    await input.fill("01/15/2024");
    await expect(input).toHaveValue("01/15/2024");
  });

  test("opens calendar on click", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
  });

  test("opens calendar via calendar icon", async ({ page }) => {
    const calendarIcon = page
      .getByTestId("date-picker-single")
      .locator(".bx--date-picker__icon");
    await calendarIcon.click({ force: true });
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
  });

  test("accepts typed date value", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.fill("12/25/2024");
    await expect(input).toHaveValue("12/25/2024");
  });

  test("selects date by clicking day in calendar", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();

    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();

    // Fixture uses defaultDate "03/15/2024" so March 2024 is shown.
    // Click day 20 (current month only, exclude prev/next month days).
    const day20 = calendar
      .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
      .filter({ hasText: /^20$/ });
    await day20.click();

    await expect(input).toHaveValue("03/20/2024");
  });

  test("selects date by clicking day and updates input", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();

    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();

    const day15 = calendar
      .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
      .filter({ hasText: /^15$/ });
    await day15.click();

    await expect(input).toHaveValue("03/15/2024");
  });

  test("calendar receives keyboard input after open", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(input).not.toHaveValue("");
  });

  test("arrow key navigation inside the calendar does not scroll the page", async ({
    page,
  }) => {
    // Give the page room to scroll and put a day near the bottom of the
    // viewport, otherwise the browser's default arrow-key scroll action
    // never kicks in and the test can't catch a regression.
    await page.evaluate(() => {
      const spacer = document.createElement("div");
      spacer.style.height = "2000px";
      document.body.appendChild(spacer);
    });

    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();

    await page.keyboard.press("ArrowDown");
    for (let i = 0; i < 5; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: arrow presses are sequential
      await page.keyboard.press("ArrowRight");
    }

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("Escape closes calendar", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toHaveClass(/open/);
    await input.focus();
    await page.keyboard.press("Escape");
    await expect(calendar).not.toHaveClass(/open/);
  });

  test("click outside closes calendar", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toHaveClass(/open/);
    await page.getByTestId("outside-date-picker").click();
    await expect(calendar).not.toHaveClass(/open/);
  });

  test("click inside the calendar keeps it open", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toHaveClass(/open/);
    // Month nav doesn't pick a date; the calendar should stay open.
    await calendar.locator(".flatpickr-months").click();
    await expect(calendar).toHaveClass(/open/);
  });

  test("min/max: disabled days not selectable", async ({ page }) => {
    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
    // With min 03/01 and max 03/31, days outside March get .flatpickr-disabled
    const disabledDay = calendar
      .locator(".flatpickr-day.flatpickr-disabled")
      .first();
    await expect(disabledDay).toBeVisible();
    const initialValue = await input.inputValue();
    await disabledDay.click();
    await expect(input).toHaveValue(initialValue);
  });

  test("range: renders two inputs", async ({ page }) => {
    const startInput = page.getByLabel("Start date");
    const endInput = page.getByLabel("End date");
    await expect(startInput).toBeVisible();
    await expect(endInput).toBeVisible();
    await expect(startInput).toHaveAttribute("placeholder", "mm/dd/yyyy");
    await expect(endInput).toHaveAttribute("placeholder", "mm/dd/yyyy");
  });

  test("range: opens calendar from start input", async ({ page }) => {
    await page.getByTestId("date-picker-range-start").click();
    const calendar = page
      .getByTestId("date-picker-range")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
  });

  test("range: opens calendar from end input", async ({ page }) => {
    await page.getByTestId("date-picker-range-end").click();
    const calendar = page
      .getByTestId("date-picker-range")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();
  });

  test("range: selecting range updates both inputs", async ({ page }) => {
    await page.getByTestId("date-picker-range-start").click();
    const calendar = page
      .getByTestId("date-picker-range")
      .getByLabel("calendar-container");
    await expect(calendar).toBeVisible();

    const day10 = calendar
      .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
      .filter({ hasText: /^10$/ });
    const day20 = calendar
      .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
      .filter({ hasText: /^20$/ });
    await day10.click();
    await day20.click();

    await expect(page.getByTestId("date-picker-range-start")).toHaveValue(
      "03/10/2024",
    );
    await expect(page.getByTestId("date-picker-range-end")).toHaveValue(
      "03/20/2024",
    );
  });

  test("range: switching between inputs keeps calendar open without replaying animation", async ({
    page,
  }) => {
    // The fixture opts into flatpickrProps={{ animate: true }} for this
    // picker; Carbon's own default is now animate: false, which would make
    // this no-replay assertion trivially true.
    await page.getByTestId("date-picker-range-start").click();
    const calendar = page
      .getByTestId("date-picker-range")
      .getByLabel("calendar-container");
    await expect(calendar).toHaveClass(/open/);

    // Wait for the initial open animation to finish before instrumenting so we
    // don't catch its animationstart. Switching focus between the two inputs
    // must not replay the slide-in animation.
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const cals = document.querySelectorAll(".flatpickr-calendar");
      const cal = cals[cals.length - 1] as HTMLElement;
      const w = window as unknown as { __fpAnimStarts: number };
      w.__fpAnimStarts = 0;
      cal.addEventListener("animationstart", (e) => {
        if ((e as AnimationEvent).animationName === "fpFadeInDown") {
          w.__fpAnimStarts += 1;
        }
      });
    });

    await page.getByTestId("date-picker-range-end").click();
    await expect(calendar).toHaveClass(/open/);
    await page.getByTestId("date-picker-range-start").click();
    await expect(calendar).toHaveClass(/open/);
    await page.waitForTimeout(300);

    const finalStarts = await page.evaluate(
      () => (window as unknown as { __fpAnimStarts: number }).__fpAnimStarts,
    );
    expect(finalStarts).toBe(0);
  });

  test("tab blur/refocus does not replay open animation", async ({
    page,
    context,
  }) => {
    // The fixture opts into flatpickrProps={{ animate: true }} for this
    // picker; Carbon's own default is now animate: false, which would make
    // this no-replay assertion trivially true.
    const input = page.getByLabel("Meeting date");
    await input.click();
    const calendar = page
      .getByTestId("date-picker-single")
      .getByLabel("calendar-container");
    await expect(calendar).toHaveClass(/open/);

    // Wait for the initial open animation to finish before instrumenting.
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const cals = document.querySelectorAll(".flatpickr-calendar");
      const cal = cals[0] as HTMLElement;
      const w = window as unknown as { __fpAnimStarts: number };
      w.__fpAnimStarts = 0;
      cal.addEventListener("animationstart", (e) => {
        if ((e as AnimationEvent).animationName === "fpFadeInDown") {
          w.__fpAnimStarts += 1;
        }
      });
    });

    // Simulate a tab blur/refocus: opening another page steals focus from the
    // input, then bringing the original page back refocuses it.
    const other = await context.newPage();
    await other.goto("about:blank");
    await other.bringToFront();
    await page.waitForTimeout(100);
    await page.bringToFront();
    await other.close();
    await page.waitForTimeout(300);

    await expect(calendar).toHaveClass(/open/);
    const finalStarts = await page.evaluate(
      () => (window as unknown as { __fpAnimStarts: number }).__fpAnimStarts,
    );
    expect(finalStarts).toBe(0);
  });

  test("range: Escape closes calendar", async ({ page }) => {
    await page.getByTestId("date-picker-range-start").click();
    const calendar = page
      .getByTestId("date-picker-range")
      .getByLabel("calendar-container");
    await expect(calendar).toHaveClass(/open/);
    await page.getByTestId("date-picker-range-start").focus();
    await page.keyboard.press("Escape");
    await expect(calendar).not.toHaveClass(/open/);
  });

  test("range: click outside closes calendar", async ({ page }) => {
    await page.getByTestId("date-picker-range-start").click();
    const calendar = page
      .getByTestId("date-picker-range")
      .getByLabel("calendar-container");
    await expect(calendar).toHaveClass(/open/);
    await page.getByTestId("outside-date-picker").click();
    await expect(calendar).not.toHaveClass(/open/);
  });

  test("range: click inside the calendar keeps it open", async ({ page }) => {
    await page.getByTestId("date-picker-range-start").click();
    const calendar = page
      .getByTestId("date-picker-range")
      .getByLabel("calendar-container");
    await expect(calendar).toHaveClass(/open/);
    // Month nav doesn't pick a date; the calendar should stay open.
    await calendar.locator(".flatpickr-months").click();
    await expect(calendar).toHaveClass(/open/);
  });

  test("range: closing the calendar lets it reopen from either input", async ({
    page,
  }) => {
    const calendar = page
      .getByTestId("date-picker-range")
      .getByLabel("calendar-container");

    // Open from start, close with outside click, reopen from end. calendarOpen
    // should flip correctly for both inputs.
    await page.getByTestId("date-picker-range-start").click();
    await expect(calendar).toHaveClass(/open/);
    await page.getByTestId("outside-date-picker").click();
    await expect(calendar).not.toHaveClass(/open/);

    await page.getByTestId("date-picker-range-end").click();
    await expect(calendar).toHaveClass(/open/);
    await page.getByTestId("outside-date-picker").click();
    await expect(calendar).not.toHaveClass(/open/);
  });

  test.describe("close event trigger", () => {
    test("single: outside-click when dismissing without changing value", async ({
      page,
    }) => {
      const input = page.getByLabel("Meeting date");
      await input.click();
      const calendar = page
        .getByTestId("date-picker-single")
        .getByLabel("calendar-container");
      await expect(calendar).toHaveClass(/open/);

      await page.getByTestId("outside-date-picker").click();

      await expect(calendar).not.toHaveClass(/open/);
      await expect(
        page.getByTestId("date-picker-single-close-triggers"),
      ).toHaveText("outside-click");
    });

    test("single: outside-click on viewport mousedown before click handler", async ({
      page,
    }) => {
      const input = page.getByLabel("Meeting date");
      await input.click();
      const calendar = page
        .getByTestId("date-picker-single")
        .getByLabel("calendar-container");
      await expect(calendar).toHaveClass(/open/);

      const viewport = page.viewportSize();
      if (!viewport) throw new Error("expected viewport size");
      await page.mouse.click(viewport.width - 5, viewport.height - 5);

      await expect(calendar).not.toHaveClass(/open/);
      await expect(
        page.getByTestId("date-picker-single-close-triggers"),
      ).toHaveText("outside-click");
    });

    test("single: outside-click when opened via calendar icon", async ({
      page,
    }) => {
      const calendarIcon = page
        .getByTestId("date-picker-single")
        .locator(".bx--date-picker__icon");
      await calendarIcon.click({ force: true });
      const calendar = page
        .getByTestId("date-picker-single")
        .getByLabel("calendar-container");
      await expect(calendar).toHaveClass(/open/);

      await page.getByTestId("outside-date-picker").click();

      await expect(calendar).not.toHaveClass(/open/);
      await expect(
        page.getByTestId("date-picker-single-close-triggers"),
      ).toHaveText("outside-click");
    });

    test("single: select when choosing a day", async ({ page }) => {
      const input = page.getByLabel("Meeting date");
      await input.click();
      const calendar = page
        .getByTestId("date-picker-single")
        .getByLabel("calendar-container");
      await expect(calendar).toHaveClass(/open/);

      const day20 = calendar
        .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
        .filter({ hasText: /^20$/ });
      await day20.click();

      await expect(calendar).not.toHaveClass(/open/);
      await expect(
        page.getByTestId("date-picker-single-close-triggers"),
      ).toHaveText("select");
    });

    test("single: escape-key on Escape", async ({ page }) => {
      const input = page.getByLabel("Meeting date");
      await input.click();
      const calendar = page
        .getByTestId("date-picker-single")
        .getByLabel("calendar-container");
      await expect(calendar).toHaveClass(/open/);

      await input.focus();
      await page.keyboard.press("Escape");

      await expect(calendar).not.toHaveClass(/open/);
      await expect(
        page.getByTestId("date-picker-single-close-triggers"),
      ).toHaveText("escape-key");
    });

    test("range: outside-click after partial selection", async ({ page }) => {
      await page.getByTestId("date-picker-range-start").click();
      const calendar = page
        .getByTestId("date-picker-range")
        .getByLabel("calendar-container");
      await expect(calendar).toHaveClass(/open/);

      const day10 = calendar
        .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
        .filter({ hasText: /^10$/ });
      await day10.click();
      await page.getByTestId("outside-date-picker").click();

      await expect(calendar).not.toHaveClass(/open/);
      await expect(
        page.getByTestId("date-picker-range-close-triggers"),
      ).toHaveText("outside-click");
    });

    test("range: select when both dates are chosen", async ({ page }) => {
      await page.getByTestId("date-picker-range-start").click();
      const calendar = page
        .getByTestId("date-picker-range")
        .getByLabel("calendar-container");
      await expect(calendar).toHaveClass(/open/);

      const day10 = calendar
        .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
        .filter({ hasText: /^10$/ });
      const day20 = calendar
        .locator(".flatpickr-day:not(.prev-month):not(.next-month)")
        .filter({ hasText: /^20$/ });
      await day10.click();
      await day20.click();

      await expect(calendar).not.toHaveClass(/open/);
      await expect(
        page.getByTestId("date-picker-range-close-triggers"),
      ).toHaveText("select");
    });
  });

  test.describe("month", () => {
    test("opens a 12-month grid instead of days", async ({ page }) => {
      const input = page.getByLabel("Billing month");
      await input.click();

      const calendar = page
        .getByTestId("date-picker-month")
        .getByLabel("calendar-container");
      await expect(calendar).toBeVisible();
      await expect(
        calendar.locator(".flatpickr-monthSelect-month"),
      ).toHaveCount(12);
      await expect(calendar.locator(".flatpickr-day")).toHaveCount(0);
    });

    test("selects a month and updates the input", async ({ page }) => {
      const input = page.getByLabel("Billing month");
      await input.click();

      const calendar = page
        .getByTestId("date-picker-month")
        .getByLabel("calendar-container");
      await calendar.getByText("Sep", { exact: true }).click();

      await expect(input).toHaveValue("September 2024");
      await expect(calendar).not.toHaveClass(/open/);
    });

    test("year stepper changes the displayed year without closing", async ({
      page,
    }) => {
      const input = page.getByLabel("Billing month");
      await input.click();

      const calendar = page
        .getByTestId("date-picker-month")
        .getByLabel("calendar-container");
      const yearInput = calendar.locator("input.cur-year");
      await expect(yearInput).toHaveValue("2024");

      await calendar.locator(".flatpickr-next-month").click();
      await expect(yearInput).toHaveValue("2025");
      await expect(calendar).toHaveClass(/open/);
    });
  });

  test.describe("multiple", () => {
    // Regression test for a long comma-joined value (many selected dates)
    // rendering underneath the calendar icon instead of being truncated
    // before it.
    test("truncates an overflowing value with an ellipsis instead of overlapping the calendar icon", async ({
      page,
    }) => {
      const input = page.getByTestId("date-picker-blackout-dates");

      // Chromium reports computed `overflow` on <input> as its own internal
      // "clip" regardless of the author-set `hidden` value, so assert the
      // properties that actually control ellipsis rendering instead.
      await expect(input).toHaveCSS("text-overflow", "ellipsis");
      await expect(input).toHaveCSS("white-space", "nowrap");
      // Reserved space for the calendar icon so ellipsized text can't render
      // underneath it.
      await expect(input).toHaveCSS("padding-right", "48px");

      const isOverflowing = await input.evaluate(
        (el) => el.scrollWidth > el.clientWidth,
      );
      expect(isOverflowing).toBe(true);
    });

    test("shift-click extends the selection to a contiguous range", async ({
      page,
    }) => {
      const input = page.getByTestId("date-picker-blackout-dates");
      await input.click();

      const calendar = page
        .getByTestId("date-picker-multiple")
        .getByLabel("calendar-container");
      await expect(calendar).toBeVisible();

      const day = (n: number) =>
        calendar
          .locator(".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)")
          .filter({ hasText: new RegExp(`^${n}$`) });

      await day(20).click();
      await day(25).click({ modifiers: ["Shift"] });

      await Promise.all(
        [20, 21, 22, 23, 24, 25].map((n) =>
          expect(day(n)).toHaveClass(/selected/),
        ),
      );
      // The pre-selected 9-13 range from the fixture's initial value
      // survives — shift-click adds to the selection, it doesn't replace it.
      await Promise.all(
        [9, 10, 11, 12, 13].map((n) => expect(day(n)).toHaveClass(/selected/)),
      );
    });

    // Regression test: nothing prevented the browser's native drag-to-select
    // text behavior on the day cells, so a shift-click (or any click-drag)
    // spanning multiple days highlighted their text instead of only
    // selecting the range. `user-select: none` on `.flatpickr-day` stops it.
    test("dragging across days while shift is held does not select their text", async ({
      page,
    }) => {
      const input = page.getByTestId("date-picker-blackout-dates");
      await input.click();

      const calendar = page
        .getByTestId("date-picker-multiple")
        .getByLabel("calendar-container");
      await expect(calendar).toBeVisible();

      const day = (n: number) =>
        calendar
          .locator(".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)")
          .filter({ hasText: new RegExp(`^${n}$`) });

      const startBox = await day(9).boundingBox();
      const endBox = await day(25).boundingBox();
      if (!startBox || !endBox) throw new Error("expected bounding boxes");

      await page.mouse.move(
        startBox.x + startBox.width / 2,
        startBox.y + startBox.height / 2,
      );
      await page.mouse.down();
      await page.keyboard.down("Shift");
      await page.mouse.move(
        endBox.x + endBox.width / 2,
        endBox.y + endBox.height / 2,
        { steps: 10 },
      );
      await page.mouse.up();
      await page.keyboard.up("Shift");

      const selection = await page.evaluate(() =>
        window.getSelection()?.toString(),
      );
      expect(selection).toBe("");
    });
  });
});
