import flatpickr from "flatpickr";

let l10n;

function updateClasses(instance) {
  const {
    calendarContainer,
    days,
    daysContainer,
    weekdayContainer,
    selectedDates,
  } = instance;

  calendarContainer.classList.add("bx--date-picker__calendar");
  calendarContainer
    .querySelector(".flatpickr-month")
    .classList.add("bx--date-picker__month");

  weekdayContainer.classList.add("bx--date-picker__weekdays");
  for (const node of weekdayContainer.querySelectorAll(".flatpickr-weekday")) {
    node.classList.add("bx--date-picker__weekday");
  }

  daysContainer.classList.add("bx--date-picker__days");
  for (const node of days.querySelectorAll(".flatpickr-day")) {
    node.classList.add("bx--date-picker__day");
    if (node.classList.contains("today") && selectedDates.length > 0) {
      node.classList.add("no-border");
    } else if (node.classList.contains("today") && selectedDates.length === 0) {
      node.classList.remove("no-border");
    }
  }
}

function updateMonthNode(instance) {
  const monthText = instance.l10n.months.longhand[instance.currentMonth];
  const staticMonthNode = instance.monthNav.querySelector(".cur-month");

  if (staticMonthNode) {
    staticMonthNode.textContent = monthText;
  } else {
    const monthSelectNode = instance.monthsDropdownContainer;
    const span = document.createElement("span");
    span.setAttribute("class", "cur-month");
    span.textContent = monthText;
    monthSelectNode.parentNode.replaceChild(span, monthSelectNode);
  }
}

async function createCalendar({ options, base, input, dispatch }) {
  let locale = options.locale;

  if (options.locale === "en" && l10n && l10n.en) {
    for (let index = 0; index < l10n.en.weekdays.shorthand.length; index++) {
      const _ = l10n.en.weekdays.shorthand[index];
      const shorthand = _.slice(0, 2);
      l10n.en.weekdays.shorthand[index] =
        shorthand === "Th" ? "Th" : shorthand.charAt(0);
    }

    locale = l10n.en;
  }

  let rangePlugin;

  if (options.mode === "range") {
    const importee = await import("flatpickr/dist/esm/plugins/rangePlugin");
    rangePlugin = importee.default;
  }

  return new flatpickr(base, {
    allowInput: true,
    disableMobile: true,
    clickOpens: true,
    locale,
    plugins: [
      options.mode === "range" && new rangePlugin({ position: "left", input }),
    ].filter(Boolean),
    nextArrow:
      '<svg width="16px" height="16px" viewBox="0 0 16 16"><polygon points="11,8 6,13 5.3,12.3 9.6,8 5.3,3.7 6,3 "/><rect width="16" height="16" style="fill: none" /></svg>',
    prevArrow:
      '<svg width="16px" height="16px" viewBox="0 0 16 16"><polygon points="5,8 10,3 10.7,3.7 6.4,8 10.7,12.3 10,13 "/><rect width="16" height="16" style="fill: none" /></svg>',
    onChange: () => {
      dispatch("change");
    },
    onClose: () => {
      dispatch("close");
    },
    onMonthChange: (_s, _d, instance) => {
      updateMonthNode(instance);
    },
    onOpen: (_s, _d, instance) => {
      dispatch("open");
      updateClasses(instance);
      updateMonthNode(instance);
    },
    ...options,
  });
}

export { createCalendar };
