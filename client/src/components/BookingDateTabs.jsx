import { useEffect, useMemo, useState } from "react";
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
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  RotateCcw,
} from "lucide-react";
import {
  getDateKey,
  isRangeSelectable,
  isSameCalendarDay,
} from "../utils/availability";
import { formatCurrency, getNightsBetween } from "../utils/dateHelpers";

const weekLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const buildMonthDays = (monthDate) => {
  const monthStart = startOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days = [];
  let cursor = gridStart;

  while (!isAfter(cursor, gridEnd)) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days;
};

const BookingDateTabs = ({
  checkIn,
  checkOut,
  availabilityCalendar = new Map(),
  availabilityLoading = false,
  availabilityError = false,
  pricing = {},
  onChange,
  onConfirm,
}) => {
  const [activeTab, setActiveTab] = useState("checkin");
  const [hoverDate, setHoverDate] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(checkIn || new Date()));
  const today = startOfDay(new Date());
  const days = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const nights = getNightsBetween(checkIn, checkOut);
  const canConfirm =
    !availabilityLoading &&
    !availabilityError &&
    nights > 0 &&
    isRangeSelectable({
      checkIn,
      checkOut,
      availabilityCalendar,
    });

  useEffect(() => {
    if (!checkIn || checkOut) return undefined;
    const timer = window.setTimeout(() => setActiveTab("checkout"), 180);
    return () => window.clearTimeout(timer);
  }, [checkIn, checkOut]);

  const selectDate = (day) => {
    const selected = startOfDay(day);
    const availability = availabilityCalendar.get(getDateKey(selected));
    const disabled =
      isBefore(selected, today) ||
      availability?.status === "full" ||
      !isSameMonth(selected, visibleMonth);

    if (disabled) return;

    if (activeTab === "checkin") {
      onChange({ checkIn: selected, checkOut: null });
      setHoverDate(null);
      return;
    }

    if (!checkIn || !isAfter(selected, startOfDay(checkIn))) {
      onChange({ checkIn: selected, checkOut: null });
      setHoverDate(null);
      return;
    }

    if (!isRangeSelectable({ checkIn, checkOut: selected, availabilityCalendar })) {
      return;
    }

    onChange({ checkIn, checkOut: selected });
    setHoverDate(null);
  };

  const clearDates = () => {
    onChange({ checkIn: null, checkOut: null });
    setActiveTab("checkin");
    setHoverDate(null);
    setVisibleMonth(startOfMonth(new Date()));
  };

  const previewEnd = checkOut || (activeTab === "checkout" ? hoverDate : null);

  return (
    <div className="booking-date-tabs">
      <div className="booking-date-tabs__header">
        <button
          type="button"
          className={`booking-date-tab ${activeTab === "checkin" ? "is-active" : ""} ${checkIn ? "is-filled" : ""}`}
          onClick={() => setActiveTab("checkin")}
          aria-pressed={activeTab === "checkin"}
        >
          <span className="booking-date-tab__label">
            <CalendarDays size={15} />
            Check-in
          </span>
          <strong>{checkIn ? format(checkIn, "dd MMM yyyy") : "Select arrival"}</strong>
          {checkIn && <Check className="booking-date-tab__status" size={17} aria-hidden="true" />}
        </button>

        <ChevronRight className="booking-date-tabs__arrow" size={19} aria-hidden="true" />

        <button
          type="button"
          className={`booking-date-tab ${activeTab === "checkout" ? "is-active" : ""} ${checkOut ? "is-filled" : ""} ${!checkIn ? "is-locked" : ""}`}
          onClick={() => checkIn && setActiveTab("checkout")}
          disabled={!checkIn}
          aria-pressed={activeTab === "checkout"}
          title={!checkIn ? "Select your check-in date first" : undefined}
        >
          <span className="booking-date-tab__label">
            <CalendarDays size={15} />
            Check-out
          </span>
          <strong>{checkOut ? format(checkOut, "dd MMM yyyy") : checkIn ? "Select departure" : "Locked"}</strong>
          {checkOut ? (
            <Check className="booking-date-tab__status" size={17} aria-hidden="true" />
          ) : !checkIn ? (
            <LockKeyhole className="booking-date-tab__status" size={15} aria-hidden="true" />
          ) : null}
        </button>
      </div>

      <div className={`booking-date-tabs__instruction is-${activeTab}`}>
        <CalendarDays size={18} aria-hidden="true" />
        {activeTab === "checkin" ? (
          <span>
            <strong>{checkIn ? "Arrival selected." : "Choose your arrival date."}</strong>
            {checkIn ? " Pick another date to change it, or continue with check-out." : " Check-out unlocks immediately after your selection."}
          </span>
        ) : (
          <span>
            <strong>{checkOut ? `${nights} night${nights === 1 ? "" : "s"} selected.` : "Now choose your departure date."}</strong>
            {checkOut ? " Your stay total is ready below." : " Hover over a date to preview the length of your stay."}
          </span>
        )}
      </div>

      <div className="booking-date-tabs__calendar">
        <div className="booking-date-tabs__nav">
          <button
            type="button"
            onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
            disabled={!isAfter(visibleMonth, startOfMonth(today))}
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft size={19} />
          </button>
          <strong>{format(visibleMonth, "MMMM yyyy")}</strong>
          <button
            type="button"
            onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight size={19} />
          </button>
        </div>

        <div className="booking-date-tabs__weekdays">
          {weekLabels.map((label) => <span key={label}>{label}</span>)}
        </div>

        <div className="booking-date-tabs__grid">
          {days.map((day) => {
            const availability = availabilityCalendar.get(getDateKey(day));
            const isPast = isBefore(day, today);
            const isOutMonth = !isSameMonth(day, visibleMonth);
            const isFull = availability?.status === "full";
            const isLimited = availability?.status === "limited";
            const isSelectedCheckIn = isSameCalendarDay(day, checkIn);
            const isSelectedCheckOut = isSameCalendarDay(day, checkOut);
            const isInRange =
              checkIn &&
              previewEnd &&
              isAfter(day, startOfDay(checkIn)) &&
              isBefore(day, startOfDay(previewEnd));
            const disabled = isPast || isFull || isOutMonth;
            const classes = [
              "booking-date-tabs__day",
              isOutMonth ? "is-muted" : "",
              isPast ? "is-disabled" : "",
              isFull ? "is-full" : "",
              isLimited ? "is-limited" : "",
              isSameCalendarDay(day, today) ? "is-today" : "",
              isInRange ? "is-range" : "",
              isSelectedCheckIn ? "is-checkin" : "",
              isSelectedCheckOut ? "is-checkout" : "",
            ].filter(Boolean).join(" ");

            return (
              <button
                key={day.toISOString()}
                type="button"
                className={classes}
                onClick={() => selectDate(day)}
                onMouseEnter={() => {
                  if (activeTab === "checkout" && checkIn && !disabled && isAfter(day, checkIn)) {
                    setHoverDate(day);
                  }
                }}
                onMouseLeave={() => setHoverDate(null)}
                disabled={disabled}
                title={
                  isFull
                    ? "No rooms available"
                    : isLimited
                      ? `Only ${availability.available} room${availability.available === 1 ? "" : "s"} left`
                      : availability
                        ? `${availability.available} rooms available`
                        : undefined
                }
              >
                <span>{format(day, "d")}</span>
              </button>
            );
          })}
        </div>

        <div className="booking-date-tabs__legend" aria-label="Availability legend">
          <span><i className="legend-available" /> Available</span>
          <span><i className="legend-limited" /> Limited</span>
          <span><i className="legend-full" /> Fully booked</span>
        </div>
      </div>

      {checkIn && checkOut && nights > 0 && (
        <div className="booking-date-tabs__summary">
          <div className="booking-date-tabs__summary-dates">
            <span>{format(checkIn, "dd MMM yyyy")}</span>
            <ChevronRight size={17} aria-hidden="true" />
            <span>{format(checkOut, "dd MMM yyyy")}</span>
          </div>
          <div>
            <span>{formatCurrency(pricing.roomRatePerNight)} x {nights} night{nights === 1 ? "" : "s"}</span>
            <strong>{formatCurrency(pricing.subtotal)}</strong>
          </div>
          <div>
            <span>{pricing.gstLabel}</span>
            <strong>{formatCurrency(pricing.gstAmount)}</strong>
          </div>
          <div className="booking-date-tabs__summary-total">
            <span>Total</span>
            <strong>{formatCurrency(pricing.totalAmount)}</strong>
          </div>
        </div>
      )}

      {canConfirm && (
        <button type="button" className="booking-date-tabs__continue" onClick={onConfirm}>
          Continue to Guest Details
          <ChevronRight size={18} />
        </button>
      )}

      {(checkIn || checkOut) && (
        <button type="button" className="booking-date-tabs__clear" onClick={clearDates}>
          <RotateCcw size={14} />
          Clear dates
        </button>
      )}
    </div>
  );
};

export default BookingDateTabs;
