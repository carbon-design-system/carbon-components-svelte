/**
 * Flatpickr plugin that replaces the day grid with a decade of years.
 * Mirrors the shape of flatpickr's bundled monthSelect plugin.
 *
 * @typedef {{ dateFormat?: string; altFormat?: string; theme?: string }} YearSelectPluginConfig
 * @typedef {HTMLSpanElement & { dateObj: Date; $i: number }} YearElement
 */

const defaultConfig = {
  dateFormat: "Y",
  altFormat: "Y",
  theme: "light",
};

/**
 * @param {Event} event
 * @returns {EventTarget | null}
 */
function getEventTarget(event) {
  if (typeof event.composedPath === "function") {
    return event.composedPath()[0] ?? null;
  }
  return event.target;
}

/**
 * @param {YearSelectPluginConfig} [pluginConfig]
 * @returns {(fp: any) => object}
 */
function yearSelectPlugin(pluginConfig) {
  const config = { ...defaultConfig, ...pluginConfig };

  return (fp) => {
    fp.config.dateFormat = config.dateFormat;
    fp.config.altFormat = config.altFormat;

    /** @type {{ yearsContainer: HTMLElement | null; rangeEl: HTMLElement | null }} */
    const self = { yearsContainer: null, rangeEl: null };

    function decadeStart(year = fp.currentYear) {
      return year - (year % 10);
    }

    function clearUnnecessaryDOMElements() {
      if (!fp.rContainer || !fp.daysContainer || !fp.weekdayContainer) return;

      fp.rContainer.removeChild(fp.daysContainer);
      fp.rContainer.removeChild(fp.weekdayContainer);

      for (const element of fp.monthElements) {
        element.parentNode?.removeChild(element);
      }

      for (const element of fp.yearElements) {
        // flatpickr wraps the year `<input>` in a `.numInputWrapper` (with
        // spinner arrow spans). Removing just the input leaves that wrapper
        // behind as an invisible sibling, which pushes our range label off
        // center within `.flatpickr-current-month`.
        const wrapper = element.closest(".numInputWrapper") ?? element;
        wrapper.parentNode?.removeChild(wrapper);
      }
    }

    function updateRangeLabel() {
      if (!self.rangeEl) return;
      const start = decadeStart() - 1;
      self.rangeEl.textContent = `${start} - ${start + 11}`;
    }

    function addRangeLabel() {
      const wrapper = fp.monthNav?.querySelector(".flatpickr-current-month");
      if (!wrapper) return;

      self.rangeEl = fp._createElement("span", "flatpickr-yearSelect-range");
      updateRangeLabel();
      wrapper.appendChild(self.rangeEl);
    }

    function addListeners() {
      fp._bind(fp.prevMonthNav, "click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Rebuilding the grid happens in the `onYearChange` hook below, so
        // it also fires for programmatic `fp.changeYear()` calls.
        fp.changeYear(decadeStart() - 10);
      });

      fp._bind(fp.nextMonthNav, "click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        fp.changeYear(decadeStart() + 10);
      });
    }

    function buildYears() {
      if (!fp.rContainer) return;

      if (self.yearsContainer) {
        self.yearsContainer.replaceChildren();
      } else {
        self.yearsContainer = fp._createElement(
          "div",
          "flatpickr-yearSelect-years",
        );
        self.yearsContainer.tabIndex = -1;
        fp.calendarContainer.classList.add(
          `flatpickr-yearSelect-theme-${config.theme}`,
        );
        fp.rContainer.appendChild(self.yearsContainer);
      }

      const start = decadeStart() - 1;

      for (let i = 0; i < 12; i++) {
        const year = start + i;
        /** @type {YearElement} */
        const yearEl = fp._createElement("span", "flatpickr-yearSelect-year");
        yearEl.dateObj = new Date(year, 0, 1);
        yearEl.$i = i;
        yearEl.textContent = String(year);
        yearEl.tabIndex = -1;
        yearEl.setAttribute("data-year", String(year));
        yearEl.addEventListener("click", selectYear);

        if (year === new Date().getFullYear()) {
          yearEl.classList.add("today");
          yearEl.setAttribute("aria-current", "date");
        }

        if (
          (fp.config.minDate &&
            yearEl.dateObj.getFullYear() < fp.config.minDate.getFullYear()) ||
          (fp.config.maxDate &&
            yearEl.dateObj.getFullYear() > fp.config.maxDate.getFullYear())
        ) {
          yearEl.classList.add("disabled");
        }

        self.yearsContainer.appendChild(yearEl);
      }

      const firstYear = start;
      const lastYear = start + 11;
      if (fp.config.minDate && firstYear <= fp.config.minDate.getFullYear()) {
        fp.prevMonthNav.classList.add("flatpickr-disabled");
      } else {
        fp.prevMonthNav.classList.remove("flatpickr-disabled");
      }
      if (fp.config.maxDate && lastYear >= fp.config.maxDate.getFullYear()) {
        fp.nextMonthNav.classList.add("flatpickr-disabled");
      } else {
        fp.nextMonthNav.classList.remove("flatpickr-disabled");
      }

      setCurrentlySelected();
    }

    function setCurrentlySelected() {
      if (!fp.rContainer || !fp.selectedDates.length) return;

      for (const selected of fp.rContainer.querySelectorAll(
        ".flatpickr-yearSelect-year.selected",
      )) {
        selected.classList.remove("selected");
      }

      const targetYear = fp.selectedDates[0].getFullYear();
      const year = fp.rContainer.querySelector(
        `.flatpickr-yearSelect-year[data-year="${targetYear}"]`,
      );
      year?.classList.add("selected");
    }

    /**
     * @param {Event} e
     */
    function selectYear(e) {
      e.preventDefault();
      e.stopPropagation();
      const eventTarget = getEventTarget(e);
      if (
        eventTarget instanceof Element &&
        !eventTarget.classList.contains("disabled")
      ) {
        setYear(/** @type {YearElement} */ (eventTarget).dateObj);
        fp.close();
      }
    }

    /**
     * @param {Date} date
     */
    function setYear(date) {
      fp.setDate(new Date(date.getFullYear(), 0, 1), true);
      setCurrentlySelected();
    }

    const shifts = {
      37: -1,
      39: 1,
      40: 3,
      38: -3,
    };

    /**
     * @param {any} _
     * @param {any} __
     * @param {any} ___
     * @param {KeyboardEvent} e
     */
    function onKeyDown(_, __, ___, e) {
      const shouldMove = shifts[e.keyCode] !== undefined;
      if (!shouldMove && e.keyCode !== 13) return;
      if (!fp.rContainer || !self.yearsContainer) return;

      const currentlySelected = fp.rContainer.querySelector(
        ".flatpickr-yearSelect-year.selected",
      );
      let index = Array.prototype.indexOf.call(
        self.yearsContainer.children,
        document.activeElement,
      );

      if (index === -1) {
        const target =
          currentlySelected || self.yearsContainer.firstElementChild;
        /** @type {HTMLElement} */ (target).focus();
        index = /** @type {YearElement} */ (target).$i;
      }

      if (shouldMove) {
        /** @type {HTMLElement} */ (
          self.yearsContainer.children[(12 + index + shifts[e.keyCode]) % 12]
        ).focus();
      } else if (
        e.keyCode === 13 &&
        self.yearsContainer.contains(document.activeElement)
      ) {
        setYear(/** @type {YearElement} */ (document.activeElement).dateObj);
      }
    }

    function destroyPluginInstance() {
      if (!self.yearsContainer) return;
      for (const year of self.yearsContainer.querySelectorAll(
        ".flatpickr-yearSelect-year",
      )) {
        year.removeEventListener("click", selectYear);
      }
    }

    return {
      onParseConfig() {
        fp.config.mode = "single";
        fp.config.enableTime = false;
      },
      onValueUpdate: setCurrentlySelected,
      onKeyDown,
      onYearChange: () => {
        buildYears();
        updateRangeLabel();
      },
      onReady: [
        () => {
          fp.currentMonth = 0;
        },
        clearUnnecessaryDOMElements,
        addRangeLabel,
        addListeners,
        buildYears,
        () => {
          fp.loadedPlugins.push("yearSelect");
        },
      ],
      onDestroy: destroyPluginInstance,
    };
  };
}

export default yearSelectPlugin;
