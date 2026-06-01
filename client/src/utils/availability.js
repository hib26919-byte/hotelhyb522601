import {
  addDays,
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isValid,
  startOfDay,
} from "date-fns";
import { normalizeDate } from "./dateHelpers";
import {
  OCCUPIED_STATUSES,
  calculateAvailability as calculateConfiguredAvailability,
  getTotalRooms,
  isOccupiedStatus,
  normalizeRoomCategory,
} from "./roomConfig";

export const ACTIVE_BOOKING_STATUSES = OCCUPIED_STATUSES;

export const getDateKey = (value) => format(startOfDay(normalizeDate(value)), "yyyy-MM-dd");

export const toLocalDate = (key) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const getRoomTotal = (roomOrCategory) => {
  if (!roomOrCategory) return 0;
  if (typeof roomOrCategory === "string") return getTotalRooms(roomOrCategory);

  return getTotalRooms(roomOrCategory.category) || Number(roomOrCategory.totalRooms || 0);
};

export const isActiveBooking = (booking) =>
  isOccupiedStatus(booking?.status);

export const bookingMatchesCategory = (booking, category) =>
  !category || normalizeRoomCategory(booking?.roomCategory) === normalizeRoomCategory(category);

export const bookingOverlapsRange = (booking, requestedCheckIn, requestedCheckOut) => {
  const checkIn = startOfDay(normalizeDate(booking.checkIn));
  const checkOut = startOfDay(normalizeDate(booking.checkOut));
  const requestedStart = startOfDay(normalizeDate(requestedCheckIn));
  const requestedEnd = startOfDay(normalizeDate(requestedCheckOut));

  if (![checkIn, checkOut, requestedStart, requestedEnd].every(isValid)) return false;
  return isBefore(checkIn, requestedEnd) && isAfter(checkOut, requestedStart);
};

export const getDatesInRange = (start, end, { includeCheckout = false } = {}) => {
  if (!start || !end) return [];
  const first = startOfDay(normalizeDate(start));
  const last = startOfDay(normalizeDate(end));
  if (!isValid(first) || !isValid(last) || isAfter(first, last)) return [];

  const endDate = includeCheckout ? last : addDays(last, -1);
  if (isBefore(endDate, first)) return [];

  return eachDayOfInterval({ start: first, end: endDate });
};

export const calculateAvailability = ({
  bookings = [],
  category,
  checkIn,
  checkOut,
  totalRooms = getRoomTotal(category),
}) => {
  if (!checkIn || !checkOut) {
    return calculateConfiguredAvailability(category, 0, Number(totalRooms || 0));
  }

  const occupied = bookings.filter(
    (booking) =>
      isActiveBooking(booking) &&
      bookingMatchesCategory(booking, category) &&
      bookingOverlapsRange(booking, checkIn, checkOut),
  ).length;

  return calculateConfiguredAvailability(category, occupied, Number(totalRooms || 0));
};

export const buildAvailabilityCalendar = ({
  bookings = [],
  category,
  totalRooms = getRoomTotal(category),
  startDate = new Date(),
  days = 60,
}) => {
  const first = startOfDay(startDate);
  const calendar = new Map();

  Array.from({ length: days }).forEach((_, index) => {
    const day = addDays(first, index);
    const nextDay = addDays(day, 1);
    const availability = calculateAvailability({
      bookings,
      category,
      checkIn: day,
      checkOut: nextDay,
      totalRooms,
    });

    let status = "available";
    if (availability.isFull) status = "full";
    else if (availability.isLimited) status = "limited";

    calendar.set(getDateKey(day), {
      ...availability,
      status,
      date: day,
    });
  });

  return calendar;
};

const buildAvailabilityLockIndex = (locks = [], category) => {
  const normalizedCategory = (category || "").toLowerCase();

  return locks.reduce((index, lock) => {
    if ((lock?.category || "").toLowerCase() !== normalizedCategory || !lock?.date) {
      return index;
    }

    index.set(lock.date, lock);
    return index;
  }, new Map());
};

const getLockAvailability = (lock, category, fallbackTotal) =>
  calculateConfiguredAvailability(
    category,
    Number(lock?.occupied || 0),
    Number(fallbackTotal || getTotalRooms(category) || lock?.totalRooms || 0),
  );

export const calculateAvailabilityFromLocks = ({
  locks = [],
  category,
  checkIn,
  checkOut,
  totalRooms = getRoomTotal(category),
}) => {
  const total = Number(totalRooms || 0);
  const stayDates = getDatesInRange(checkIn, checkOut);

  if (stayDates.length === 0) {
    return calculateConfiguredAvailability(category, 0, total);
  }

  const lockIndex = buildAvailabilityLockIndex(locks, category);
  const minimumAvailable = stayDates.reduce((available, day) => {
    const dayAvailability = getLockAvailability(lockIndex.get(getDateKey(day)), category, total);
    return Math.min(available, dayAvailability.available);
  }, total);

  return calculateConfiguredAvailability(category, total - minimumAvailable, total);
};

export const buildAvailabilityCalendarFromLocks = ({
  locks = [],
  category,
  totalRooms = getRoomTotal(category),
  startDate = new Date(),
  days = 370,
}) => {
  const first = startOfDay(startDate);
  const calendar = new Map();
  const lockIndex = buildAvailabilityLockIndex(locks, category);

  Array.from({ length: days }).forEach((_, index) => {
    const day = addDays(first, index);
    const availability = getLockAvailability(
      lockIndex.get(getDateKey(day)),
      category,
      totalRooms,
    );

    let status = "available";
    if (availability.isFull) status = "full";
    else if (availability.isLimited) status = "limited";

    calendar.set(getDateKey(day), {
      ...availability,
      status,
      date: day,
    });
  });

  return calendar;
};

export const getAvailabilityLabel = ({ available, total }) => {
  if (available <= 0) return "Fully Booked";
  if (available <= 3) return `Limited - ${available} left`;
  if (available < total) return `${available} rooms available`;
  return "Available";
};

export const isRangeSelectable = ({ checkIn, checkOut, availabilityCalendar }) => {
  const stayDates = getDatesInRange(checkIn, checkOut);
  return stayDates.every((day) => availabilityCalendar.get(getDateKey(day))?.status !== "full");
};

export const isSameCalendarDay = (left, right) =>
  left && right && isSameDay(normalizeDate(left), normalizeDate(right));
