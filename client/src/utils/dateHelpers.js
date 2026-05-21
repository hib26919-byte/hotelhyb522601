// C:\Users\velch\Documents\BaelTreeHotels\client\src\utils\dateHelpers.js

import { format, isAfter, isBefore, isValid, parseISO, addDays, eachDayOfInterval } from "date-fns";

/* ── Safe date normalizer ── */
export const normalizeDate = (val) => {
  if (!val) return new Date();
  if (val?.toDate) return val.toDate();
  if (val?.seconds) return new Date(val.seconds * 1000);
  if (val instanceof Date) return val;
  const parsed = new Date(val);
  return isNaN(parsed) ? new Date() : parsed;
};

/* ── Format date ── */
export const formatDate = (val, pattern = "dd MMM yyyy") => {
  const d = normalizeDate(val);
  return d && isValid(d) ? format(d, pattern) : "—";
};

/* ── Format currency ── */
export const formatCurrency = (amount, currency = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

/* ── Count nights between two dates ── */
export const getNightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const a = normalizeDate(checkIn);
  const b = normalizeDate(checkOut);
  if (!isValid(a) || !isValid(b)) return 0;
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
};

/* ── Build fully booked dates for a room ── */
export const buildFullyBookedDates = (bookings = [], totalRooms = 1) => {
  const dateMap = new Map();

  bookings.forEach((booking) => {
    if (booking.status === "cancelled") return;
    const checkIn = normalizeDate(booking.checkIn);
    const checkOut = normalizeDate(booking.checkOut);
    if (!isValid(checkIn) || !isValid(checkOut)) return;

    try {
      const days = eachDayOfInterval({ start: checkIn, end: addDays(checkOut, -1) });
      days.forEach((day) => {
        const key = format(day, "yyyy-MM-dd");
        dateMap.set(key, (dateMap.get(key) || 0) + 1);
      });
    } catch {
      // invalid interval
    }
  });

  const fullyBooked = [];
  dateMap.forEach((count, key) => {
    if (count >= totalRooms) {
      const [y, m, d] = key.split("-").map(Number);
      fullyBooked.push(new Date(y, m - 1, d));
    }
  });

  return fullyBooked;
};

/* ── Get upcoming bookings (check-out in future) ── */
export const getUpcomingBookings = (bookings = []) => {
  const now = new Date();
  return bookings
    .filter((b) => {
      const checkOut = normalizeDate(b.checkOut);
      return isValid(checkOut) && isAfter(checkOut, now) && b.status !== "cancelled";
    })
    .sort((a, b) => normalizeDate(a.checkIn) - normalizeDate(b.checkIn));
};