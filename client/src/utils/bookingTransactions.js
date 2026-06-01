import {
  arrayRemove,
  arrayUnion,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getDateKey, getDatesInRange } from "./availability";
import { normalizeDate } from "./dateHelpers";
import {
  getTotalRooms,
  isOccupiedStatus,
  normalizeRoomCategory,
} from "./roomConfig";

export const generateBookingId = () =>
  `BT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const getLockId = (category, date) => `${category}_${getDateKey(date)}`;

const getBookingStayDates = (booking) =>
  getDatesInRange(normalizeDate(booking.checkIn), normalizeDate(booking.checkOut));

const getBookingLockIds = (booking, { useStoredIds = true } = {}) => {
  const category = normalizeRoomCategory(booking?.roomCategory);
  if (!category || !booking?.checkIn || !booking?.checkOut) return [];

  return useStoredIds && booking.inventoryLockIds?.length
    ? booking.inventoryLockIds
    : getBookingStayDates(booking).map((date) => getLockId(category, date));
};

const getLockMetadata = (lockId) => {
  const separatorIndex = lockId.indexOf("_");
  return {
    category: lockId.slice(0, separatorIndex),
    date: lockId.slice(separatorIndex + 1),
  };
};

export const createBookingWithInventoryLock = async ({
  bookingId,
  bookingData,
  room,
  checkIn,
  checkOut,
}) => {
  const category = normalizeRoomCategory(bookingData.roomCategory || room?.category);
  const totalRooms = getTotalRooms(category);
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

  return saveBookingWithInventoryLock({
    bookingId,
    bookingData: {
      status,
      paymentFailureReason,
    },
  });
};

export const saveBookingWithInventoryLock = async ({
  bookingId,
  bookingData = {},
  deleteBooking = false,
}) => {
  if (!bookingId) {
    throw new Error("A booking ID is required.");
  }

  const bookingRef = doc(db, "bookings", bookingId);

  try {
    await runTransaction(db, async (transaction) => {
      const bookingSnapshot = await transaction.get(bookingRef);
      const existingBooking = bookingSnapshot.data() || {};
      const nextBooking = {
        ...existingBooking,
        ...bookingData,
        bookingId,
      };

      const oldLockIds =
        bookingSnapshot.exists() &&
        isOccupiedStatus(existingBooking.status) &&
        !existingBooking.inventoryLockReleased
          ? getBookingLockIds(existingBooking)
          : [];
      const newLockIds =
        !deleteBooking && isOccupiedStatus(nextBooking.status)
          ? getBookingLockIds(nextBooking, { useStoredIds: false })
          : [];

      if (!deleteBooking && isOccupiedStatus(nextBooking.status) && newLockIds.length === 0) {
        throw new Error("Invalid booking dates.");
      }

      const lockIds = [...new Set([...oldLockIds, ...newLockIds])];
      const lockRefs = lockIds.map((lockId) => doc(db, "availabilityLocks", lockId));
      const lockSnapshots = [];

      for (const lockRef of lockRefs) {
        lockSnapshots.push(await transaction.get(lockRef));
      }

      lockRefs.forEach((lockRef, index) => {
        const lockId = lockIds[index];
        const metadata = getLockMetadata(lockId);
        const data = lockSnapshots[index].data() || {};
        const bookingIds = Array.isArray(data.bookingIds) ? data.bookingIds : [];
        const alreadyCounted = bookingIds.includes(bookingId);
        const shouldBeCounted = newLockIds.includes(lockId);
        const occupiedWithoutBooking = Math.max(
          0,
          Number(data.occupied || 0) - (alreadyCounted ? 1 : 0),
        );
        const occupied = occupiedWithoutBooking + (shouldBeCounted ? 1 : 0);
        const totalRooms = getTotalRooms(metadata.category);

        if (shouldBeCounted && occupied > totalRooms) {
          throw new Error("ROOM_FULLY_BOOKED");
        }

        transaction.set(
          lockRef,
          {
            ...metadata,
            occupied,
            totalRooms,
            bookingIds: shouldBeCounted
              ? arrayUnion(bookingId)
              : arrayRemove(bookingId),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      });

      if (deleteBooking) {
        if (bookingSnapshot.exists()) {
          transaction.delete(bookingRef);
        }
        return;
      }

      transaction.set(
        bookingRef,
        {
          ...bookingData,
          bookingId,
          inventoryLockIds: newLockIds,
          inventoryLockReleased: newLockIds.length === 0,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });

    return { success: true };
  } catch (error) {
    if (error.message === "ROOM_FULLY_BOOKED") {
      return { success: false, reason: "ROOM_FULLY_BOOKED" };
    }
    throw error;
  }
};

export const deleteBookingWithInventoryLock = (bookingId) =>
  saveBookingWithInventoryLock({
    bookingId,
    deleteBooking: true,
  });
