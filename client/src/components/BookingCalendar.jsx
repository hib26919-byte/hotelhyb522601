import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getDateKey,
  isSameCalendarDay,
  isRangeSelectable,
} from "../utils/availability";
import { formatCurrency, getNightsBetween } from "../utils/dateHelpers";

const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const buildMonthDays = (monthDate) => {
  const monthStart = startOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(endOfMonth(monthStart));
  const days = [];
  let cursor = gridStart;

  while (!isAfter(cursor, gridEnd)) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days;
};

const getDayClasses = ({
  day,
  monthDate,
  today,
  checkIn,
  checkOut,
  availabilityCalendar,
}) => {
  const availability = availabilityCalendar.get(getDateKey(day));
  const isPast = isBefore(day, today);
  const isOutMonth = !isSameMonth(day, monthDate);
  const isCheckIn = isSameCalendarDay(day, checkIn);
  const isCheckOut = isSameCalendarDay(day, checkOut);
  const inRange =
    checkIn &&
    checkOut &&
    isAfter(day, startOfDay(checkIn)) &&
    isBefore(day, startOfDay(checkOut));

  return [
    "booking-calendar__day",
    isOutMonth ? "is-muted" : "",
    isPast ? "is-disabled" : "",
    availability?.status ? `is-${availability.status}` : "",
    isCheckIn || isCheckOut ? "is-selected" : "",
    inRange ? "is-range" : "",
    isSameCalendarDay(day, today) ? "is-today" : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const MonthGrid = ({
  monthDate,
  checkIn,
  checkOut,
  availabilityCalendar,
  onSelect,
}) => {
  const today = startOfDay(new Date());
  const days = buildMonthDays(monthDate);

  return (
    <div className="booking-calendar__month">
      <div className="booking-calendar__month-title">
        {format(monthDate, "MMMM yyyy")}
      </div>
      <div className="booking-calendar__weekdays">
        {weekLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="booking-calendar__grid">
        {days.map((day) => {
          const availability = availabilityCalendar.get(getDateKey(day));
          const disabled =
            isBefore(day, today) ||
            availability?.status === "full" ||
            !isSameMonth(day, monthDate);

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={getDayClasses({
                day,
                monthDate,
                today,
                checkIn,
                checkOut,
                availabilityCalendar,
              })}
              onClick={() => onSelect(day)}
              disabled={disabled}
              title={
                availability
                  ? `${availability.available} of ${availability.total} rooms available`
                  : undefined
              }
            >
              <span>{format(day, "d")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const BookingCalendar = ({
  checkIn,
  checkOut,
  onChange,
  availabilityCalendar = new Map(),
  totalAmount = 0,
}) => {
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(checkIn || new Date()));
  const [touchStart, setTouchStart] = useState(null);
  const nights = getNightsBetween(checkIn, checkOut);

  const summary = useMemo(() => {
    const inLabel = checkIn ? format(checkIn, "dd MMM yyyy") : "Select date";
    const outLabel = checkOut ? format(checkOut, "dd MMM yyyy") : "Select date";
    return `Check-in: ${inLabel} -> Check-out: ${outLabel} · ${nights} night${nights === 1 ? "" : "s"} · ${formatCurrency(totalAmount)}`;
  }, [checkIn, checkOut, nights, totalAmount]);

  const handleSelect = (day) => {
    const selected = startOfDay(day);

    if (!checkIn || (checkIn && checkOut) || isBefore(selected, startOfDay(checkIn))) {
      onChange({ checkIn: selected, checkOut: null });
      return;
    }

    if (isSameCalendarDay(selected, checkIn)) {
      onChange({ checkIn: selected, checkOut: null });
      return;
    }

    const candidate = { checkIn, checkOut: selected };
    if (!isRangeSelectable({ ...candidate, availabilityCalendar })) {
      onChange({ checkIn: selected, checkOut: null });
      return;
    }

    onChange(candidate);
  };

  const handleTouchEnd = (event) => {
    if (touchStart === null) return;
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 50) {
      setVisibleMonth((month) => (distance < 0 ? addMonths(month, 1) : subMonths(month, 1)));
    }
    setTouchStart(null);
  };

  return (
    <div
      className="booking-calendar"
      onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
      onTouchEnd={handleTouchEnd}
    >
      <div className="booking-calendar__nav">
        <button
          type="button"
          onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <strong>Select Your Stay Dates</strong>
        <button
          type="button"
          onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="booking-calendar__months">
        <MonthGrid
          monthDate={visibleMonth}
          checkIn={checkIn}
          checkOut={checkOut}
          availabilityCalendar={availabilityCalendar}
          onSelect={handleSelect}
        />
        <MonthGrid
          monthDate={addMonths(visibleMonth, 1)}
          checkIn={checkIn}
          checkOut={checkOut}
          availabilityCalendar={availabilityCalendar}
          onSelect={handleSelect}
        />
      </div>

      <div className="booking-calendar__legend" aria-label="Availability legend">
        <span><i className="legend-available" /> Available</span>
        <span><i className="legend-limited" /> Limited</span>
        <span><i className="legend-full" /> Fully booked</span>
      </div>

      <div className="booking-calendar__summary">{summary}</div>
    </div>
  );
};

export default BookingCalendar;
