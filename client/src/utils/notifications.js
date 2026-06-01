import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { formatCurrency, formatDate } from "./dateHelpers";

const stripUndefined = (value) => {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (!value || typeof value !== "object" || value.toDate) return value;

  return Object.entries(value).reduce((acc, [key, item]) => {
    if (item !== undefined) acc[key] = stripUndefined(item);
    return acc;
  }, {});
};

export const createAdminNotification = async ({
  type,
  icon,
  title,
  message,
  detail,
  relatedId,
  relatedType,
  meta,
  ...extra
}) => {
  const payload = stripUndefined({
    type,
    icon,
    title,
    message,
    detail,
    isRead: false,
    isAdminOnly: true,
    relatedId,
    relatedType,
    createdAt: serverTimestamp(),
    meta,
    ...extra,
  });

  return addDoc(collection(db, "notifications"), payload);
};

export const notifyNewUser = ({ uid, name, email }) =>
  createAdminNotification({
    type: "new_user",
    icon: "user",
    title: "New Guest Registered",
    message: `${name || "A guest"} just created an account`,
    detail: email || "",
    relatedId: uid,
    relatedType: "user",
    userName: name,
    userEmail: email,
    meta: { userName: name, userEmail: email },
  });

export const notifyBookingConfirmed = ({ bookingId, booking, paymentId }) =>
  createAdminNotification({
    type: "new_booking",
    icon: "booking",
    title: "New Booking Received",
    message: `${booking.userName || "Guest"} booked a ${booking.roomCategory || "room"} room`,
    detail: `Check-in: ${formatDate(booking.checkIn)} | ${formatCurrency(booking.totalAmount)}`,
    relatedId: bookingId,
    relatedType: "booking",
    userName: booking.userName,
    userEmail: booking.userEmail,
    roomCategory: booking.roomCategory,
    amount: booking.totalAmount,
    paymentId,
    meta: {
      userName: booking.userName,
      userEmail: booking.userEmail,
      roomCategory: booking.roomCategory,
      totalAmount: booking.totalAmount,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      paymentId,
    },
  });

export const notifyBookingCancelled = ({ bookingId, booking }) =>
  createAdminNotification({
    type: "cancellation",
    icon: "cancel",
    title: "Booking Cancelled",
    message: `${booking.userName || "Guest"} cancelled a ${booking.roomCategory || "room"} booking`,
    detail: `Booking ID: ${bookingId} | ${formatCurrency(booking.totalAmount)} refund pending`,
    relatedId: bookingId,
    relatedType: "booking",
    userName: booking.userName,
    roomCategory: booking.roomCategory,
    amount: booking.totalAmount,
    meta: {
      userName: booking.userName,
      roomCategory: booking.roomCategory,
      totalAmount: booking.totalAmount,
      bookingId,
    },
  });
