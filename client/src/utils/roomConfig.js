export const ROOM_CONFIG = Object.freeze({
  standard: Object.freeze({ label: "Standard Room", total: 5, single: 2500, double: 3000 }),
  executive: Object.freeze({ label: "Executive Room", total: 55, single: 3500, double: 4000 }),
  premium: Object.freeze({ label: "Premium Room", total: 10, single: 4500, double: 5000 }),
  suite: Object.freeze({ label: "Suite Room", total: 15, single: 6500, double: 7500 }),
});

export const ROOM_CATEGORY_KEYS = Object.freeze(Object.keys(ROOM_CONFIG));

export const ROOM_TOTALS = Object.freeze(
  ROOM_CATEGORY_KEYS.reduce((totals, category) => {
    totals[category] = ROOM_CONFIG[category].total;
    return totals;
  }, {}),
);

export const OCCUPIED_STATUS_VALUES = Object.freeze([
  "confirmed",
  "Confirmed",
  "pending",
  "Pending",
  "pending_verification",
  "pending_payment",
  "Pending_payment",
]);

export const normalizeRoomCategory = (category = "") =>
  String(category).toLowerCase().trim();

export const normalizeBookingStatus = (status = "") =>
  String(status).toLowerCase().trim();

export const OCCUPIED_STATUSES = new Set(
  OCCUPIED_STATUS_VALUES.map(normalizeBookingStatus),
);

export const isOccupiedStatus = (status) =>
  OCCUPIED_STATUSES.has(normalizeBookingStatus(status));

export const getTotalRooms = (category) =>
  ROOM_CONFIG[normalizeRoomCategory(category)]?.total ?? 0;

export const getTotalRoomInventory = () =>
  ROOM_CATEGORY_KEYS.reduce((total, category) => total + ROOM_CONFIG[category].total, 0);

export const calculateAvailability = (category, occupiedCount = 0, totalOverride) => {
  const total = Number(totalOverride ?? getTotalRooms(category));
  const occupied = Math.min(Math.max(0, Number(occupiedCount || 0)), total);
  const available = Math.max(0, total - occupied);

  return {
    available,
    occupied,
    total,
    isAvailable: available > 0,
    isLimited: available > 0 && available <= 3,
    isFull: available === 0,
    percentOccupied: total > 0 ? Math.round((occupied / total) * 100) : 0,
  };
};

export const withRoomConfig = (room = {}) => {
  const config = ROOM_CONFIG[normalizeRoomCategory(room.category)];
  if (!config) return room;

  return {
    ...room,
    name: room.name || config.label,
    singlePrice: room.singlePrice ?? config.single,
    doublePrice: room.doublePrice ?? config.double,
    totalRooms: config.total,
  };
};
