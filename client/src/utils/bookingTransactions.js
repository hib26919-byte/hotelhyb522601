import {
  arrayRemove,
  arrayUnion,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getDateKey, getDatesInRange, getRoomTotal } from "./availability";
import { normalizeDate } from "./dateHelpers";

export const generateBookingId = () =>
  `BT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const getLockId = (category, date) => `${category}_${getDateKey(date)}`;

const getBookingStayDates = (booking) =>
  getDatesInRange(normalizeDate(booking.checkIn), normalizeDate(booking.checkOut));

export const createBookingWithInventoryLock = async ({
  bookingId,
  bookingData,
  room,
  checkIn,
  checkOut,
}) => {
  const category = (bookingData.roomCategory || room?.category || "").toLowerCase();
  const totalRooms = getRoomTotal(room || category);
  const stayDates = getDatesInRange(checkIn, checkOut);

  if (!bookingId || !category || stayDates.length === 0) {
    throw new Error("Invalid booking dates.");
  }

  const lockRefs = stayDates.map((date) => doc(db, "availabilityLocks", getLockId(category, date)));
  const lockIds = stayDates.map((date) => getLockId(category, date));
  const bookingRef = doc(db, "bookings", bookingId);

  try {
    await runTransaction(db, async (transaction) => {
      const lockSnapshots = [];
      for (const lockRef of lockRefs) {
        lockSnapshots.push(await transaction.get(lockRef));
      }

      lockSnapshots.forEach((snapshot) => {
        const occupied = Number(snapshot.data()?.occupied || 0);
        if (occupied >= totalRooms) {
          throw new Error("ROOM_FULLY_BOOKED");
        }
      });

      lockRefs.forEach((lockRef, index) => {
        const existing = lockSnapshots[index].data() || {};
        transaction.set(
          lockRef,
          {
            category,
            date: getDateKey(stayDates[index]),
            occupied: Number(existing.occupied || 0) + 1,
            totalRooms,
            bookingIds: arrayUnion(bookingId),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      });

      transaction.set(bookingRef, {
        ...bookingData,
        bookingId,
        inventoryLockIds: lockIds,
        inventoryLockReleased: false,
        updatedAt: serverTimestamp(),
      });
    });

    return { success: true };
  } catch (error) {
    if (error.message === "ROOM_FULLY_BOOKED") {
      return { success: false, reason: "ROOM_FULLY_BOOKED" };
    }
    throw error;
  }
};

export const releaseBookingInventoryLock = async ({
  bookingId,
  status = "payment_failed",
  paymentFailureReason = "",
}) => {
  if (!bookingId) return;

  const bookingRef = doc(db, "bookings", bookingId);

  await runTransaction(db, async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);
    if (!bookingSnapshot.exists()) return;

    const booking = bookingSnapshot.data();
    if (booking.inventoryLockReleased) {
      transaction.update(bookingRef, {
        status,
        paymentFailureReason,
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const category = (booking.roomCategory || "").toLowerCase();
    const lockIds = booking.inventoryLockIds?.length
      ? booking.inventoryLockIds
      : getBookingStayDates(booking).map((date) => getLockId(category, date));
    const lockRefs = lockIds.map((lockId) => doc(db, "availabilityLocks", lockId));
    const lockSnapshots = [];

    for (const lockRef of lockRefs) {
      lockSnapshots.push(await transaction.get(lockRef));
    }

    lockRefs.forEach((lockRef, index) => {
      const data = lockSnapshots[index].data() || {};
      const hasBooking = Array.isArray(data.bookingIds)
        ? data.bookingIds.includes(bookingId)
        : true;
      const occupied = Number(data.occupied || 0);

      transaction.set(
        lockRef,
        {
          occupied: hasBooking ? Math.max(0, occupied - 1) : occupied,
          bookingIds: arrayRemove(bookingId),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });

    transaction.update(bookingRef, {
      status,
      paymentFailureReason,
      inventoryLockReleased: true,
      updatedAt: serverTimestamp(),
    });
  });
};
