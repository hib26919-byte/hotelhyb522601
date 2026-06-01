import { useEffect, useMemo, useState } from "react";
import { addDays, startOfDay } from "date-fns";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../utils/firebase";
import {
  buildAvailabilityCalendarFromLocks,
  calculateAvailabilityFromLocks,
  getDateKey,
  toLocalDate,
} from "../utils/availability";
import {
  ROOM_CATEGORY_KEYS,
  getTotalRooms,
  normalizeRoomCategory,
} from "../utils/roomConfig";

const withStateFlags = (availability, loading, error) => ({
  ...availability,
  loading,
  error,
});

export const useRoomAvailability = (
  category,
  checkIn,
  checkOut,
  { enabled = true } = {},
) => {
  const normalizedCategory = normalizeRoomCategory(category);
  const totalRooms = getTotalRooms(normalizedCategory);
  const [locks, setLocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !normalizedCategory) {
      setLocks([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLocks([]);
    setLoading(true);
    setError(null);

    const locksQuery = query(
      collection(db, "availabilityLocks"),
      where("category", "==", normalizedCategory),
    );
    const unsubscribe = onSnapshot(
      locksQuery,
      (snapshot) => {
        setLocks(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })));
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        console.error(`[Firestore] availabilityLocks/${normalizedCategory}:`, snapshotError.message);
        setLocks([]);
        setLoading(false);
        setError(snapshotError);
      },
    );

    return () => unsubscribe();
  }, [enabled, normalizedCategory]);

  const availability = useMemo(
    () =>
      calculateAvailabilityFromLocks({
        locks,
        category: normalizedCategory,
        checkIn,
        checkOut,
        totalRooms,
      }),
    [checkIn, checkOut, locks, normalizedCategory, totalRooms],
  );

  const calendar = useMemo(
    () =>
      buildAvailabilityCalendarFromLocks({
        locks,
        category: normalizedCategory,
        totalRooms,
      }),
    [locks, normalizedCategory, totalRooms],
  );

  return {
    ...withStateFlags(availability, loading, error),
    calendar,
    locks,
  };
};

export const useAllRoomsAvailabilityToday = () => {
  const [todayKey, setTodayKey] = useState(() => getDateKey(new Date()));

  useEffect(() => {
    const now = new Date();
    const nextDay = startOfDay(addDays(now, 1));
    const timer = window.setTimeout(
      () => setTodayKey(getDateKey(new Date())),
      Math.max(1000, nextDay.getTime() - now.getTime()),
    );

    return () => window.clearTimeout(timer);
  }, [todayKey]);

  const [locks, setLocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLocks([]);
    setLoading(true);
    setError(null);

    const locksQuery = query(
      collection(db, "availabilityLocks"),
      where("date", "==", todayKey),
    );
    const unsubscribe = onSnapshot(
      locksQuery,
      (snapshot) => {
        setLocks(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })));
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        console.error(`[Firestore] availabilityLocks/${todayKey}:`, snapshotError.message);
        setLocks([]);
        setLoading(false);
        setError(snapshotError);
      },
    );

    return () => unsubscribe();
  }, [todayKey]);

  return useMemo(() => {
    const checkIn = toLocalDate(todayKey);
    const checkOut = addDays(checkIn, 1);

    return ROOM_CATEGORY_KEYS.reduce((allAvailability, category) => {
      allAvailability[category] = withStateFlags(
        calculateAvailabilityFromLocks({
          locks,
          category,
          checkIn,
          checkOut,
          totalRooms: getTotalRooms(category),
        }),
        loading,
        error,
      );
      return allAvailability;
    }, {});
  }, [error, loading, locks, todayKey]);
};
