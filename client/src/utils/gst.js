export const DEFAULT_GST_SETTINGS = {
  useDefaultSlabs: true,
  overrideRate: null,
};

export const normalizeGstSettings = (settings = DEFAULT_GST_SETTINGS) => ({
  useDefaultSlabs: settings?.useDefaultSlabs !== false,
  overrideRate:
    settings?.overrideRate === null || settings?.overrideRate === undefined || settings?.overrideRate === ""
      ? null
      : Number(settings.overrideRate),
});

export const calculateGST = (roomRatePerNight = 0, settings = DEFAULT_GST_SETTINGS) => {
  const normalized = normalizeGstSettings(settings);
  if (!normalized.useDefaultSlabs && Number.isFinite(normalized.overrideRate)) {
    return {
      rate: normalized.overrideRate,
      label: `GST (${normalized.overrideRate}%)`,
      isOverride: true,
    };
  }

  const rate = Number(roomRatePerNight || 0) > 7500 ? 18 : 12;
  return {
    rate,
    label: `GST (${rate}%)`,
    isOverride: false,
  };
};

export const getBookingPricing = ({
  room,
  occupancy = "single",
  nights = 0,
  gstSettings = DEFAULT_GST_SETTINGS,
}) => {
  const roomRatePerNight =
    occupancy === "double"
      ? Number(room?.doublePrice || 0)
      : Number(room?.singlePrice || 0);
  const safeNights = Math.max(Number(nights || 0), 0);
  const subtotal = roomRatePerNight * safeNights;
  const gstInfo = calculateGST(roomRatePerNight, gstSettings);
  const gstAmount = Math.round((subtotal * gstInfo.rate) / 100);

  return {
    roomRatePerNight,
    nights: safeNights,
    subtotal,
    gstRate: gstInfo.rate,
    gstLabel: gstInfo.label,
    gstAmount,
    totalAmount: subtotal + gstAmount,
  };
};

export const getBookingAmountBreakdown = (booking, fallbackGstRate = 12) => {
  const total = Number(booking?.totalAmount || 0);
  const storedSubtotal = booking?.subtotal ?? booking?.roomSubtotal;
  const storedGst = booking?.gstAmount;
  const rate = Number(booking?.gstRate ?? booking?.gstPercentage ?? fallbackGstRate ?? 12);

  if (storedSubtotal !== undefined && storedGst !== undefined) {
    return {
      subtotal: Number(storedSubtotal || 0),
      gstAmount: Number(storedGst || 0),
      gstRate: rate,
      totalAmount: total || Number(storedSubtotal || 0) + Number(storedGst || 0),
    };
  }

  if (!total) {
    return { subtotal: 0, gstAmount: 0, gstRate: rate, totalAmount: 0 };
  }

  const subtotal = Math.round(total / (1 + rate / 100));
  return {
    subtotal,
    gstAmount: total - subtotal,
    gstRate: rate,
    totalAmount: total,
  };
};
