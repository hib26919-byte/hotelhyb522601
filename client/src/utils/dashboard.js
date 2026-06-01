// C:\Users\velch\Documents\BaelTreeHotels\client\src\utils\dashboard.js

import { format, subDays, startOfDay } from "date-fns";
import { normalizeDate } from "./dateHelpers";
import { getTotalRoomInventory } from "./roomConfig";

/* ── Download CSV ── */
export const downloadCsv = (filename, rows) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ── Build dashboard analytics ── */
export const buildDashboardData = (bookings = [], rooms = [], users = [], pageViews = []) => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const todayKey = format(now, "yyyy-MM-dd");
  const yesterdayKey = format(subDays(now, 1), "yyyy-MM-dd");

  const thisMonthBookings = bookings.filter((b) => {
    const d = normalizeDate(b.createdAt);
    return d >= thisMonthStart && b.status !== "cancelled";
  });

  const lastMonthBookings = bookings.filter((b) => {
    const d = normalizeDate(b.createdAt);
    return d >= lastMonthStart && d <= lastMonthEnd && b.status !== "cancelled";
  });

  const totalRevenue = thisMonthBookings.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const lastRevenue = lastMonthBookings.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const revenueTrend = lastRevenue ? Math.round(((totalRevenue - lastRevenue) / lastRevenue) * 100) : 0;

  const confirmedThisMonth = thisMonthBookings.filter((b) => b.status === "confirmed").length;
  const confirmedLastMonth = lastMonthBookings.filter((b) => b.status === "confirmed").length;
  const bookingTrend = confirmedLastMonth
    ? Math.round(((confirmedThisMonth - confirmedLastMonth) / confirmedLastMonth) * 100)
    : 0;

  const totalRoomsInventory = getTotalRoomInventory();
  const todayBookings = bookings.filter((b) => {
    const ci = normalizeDate(b.checkIn);
    const co = normalizeDate(b.checkOut);
    return ci <= now && co >= now && b.status === "confirmed";
  });
  const occupancyRate = totalRoomsInventory
    ? Math.round((todayBookings.length / totalRoomsInventory) * 100)
    : 0;

  const thisMonthPageViews = pageViews.filter((view) => normalizeDate(view.createdAt) >= thisMonthStart);
  const todayPageViews = pageViews.filter((view) => (view.dateKey || format(normalizeDate(view.createdAt), "yyyy-MM-dd")) === todayKey);
  const yesterdayPageViews = pageViews.filter((view) => (view.dateKey || format(normalizeDate(view.createdAt), "yyyy-MM-dd")) === yesterdayKey);
  const pageViewTrend = yesterdayPageViews.length
    ? Math.round(((todayPageViews.length - yesterdayPageViews.length) / yesterdayPageViews.length) * 100)
    : 0;
  const uniqueVisitors = new Set(thisMonthPageViews.map((view) => view.visitorId).filter(Boolean)).size;

  const kpis = [
    {
      label: "Revenue (This Month)",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      trend: revenueTrend,
    },
    {
      label: "Bookings (This Month)",
      value: thisMonthBookings.length,
      trend: bookingTrend,
    },
    {
      label: "Total Users",
      value: users.length,
      trend: 0,
    },
    {
      label: "Page Views (Today)",
      value: todayPageViews.length,
      trend: pageViewTrend,
    },
  ];

  // Daily revenue (last 30 days)
  const dailyRevenue = Array.from({ length: 30 }, (_, i) => {
    const day = subDays(now, 29 - i);
    const dateKey = format(day, "MMM dd");
    const thisMonthRev = bookings
      .filter((b) => {
        const d = normalizeDate(b.createdAt);
        return format(d, "MMM dd") === dateKey && b.status !== "cancelled";
      })
      .reduce((s, b) => s + (b.totalAmount || 0), 0);

    return { date: dateKey, thisMonth: thisMonthRev, lastMonth: 0 };
  });

  // Monthly bookings by category (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return format(d, "MMM");
  });

  const monthlyCategoryData = months.map((month) => {
    const monthBookings = bookings.filter((b) => {
      const d = normalizeDate(b.createdAt);
      return format(d, "MMM") === month && b.status !== "cancelled";
    });
    return {
      name: month,
      standard: monthBookings.filter((b) => b.roomCategory === "standard").length,
      executive: monthBookings.filter((b) => b.roomCategory === "executive").length,
      premium: monthBookings.filter((b) => b.roomCategory === "premium").length,
      suite: monthBookings.filter((b) => b.roomCategory === "suite").length,
    };
  });

  // Category revenue share
  const categories = ["standard", "executive", "premium", "suite"];
  const categoryRevenueData = categories.map((cat) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: bookings
      .filter((b) => b.roomCategory === cat && b.status !== "cancelled")
      .reduce((s, b) => s + (b.totalAmount || 0), 0),
  }));

  const dailyPageViews = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(now, 13 - i);
    const key = format(day, "yyyy-MM-dd");
    return {
      date: format(day, "MMM dd"),
      views: pageViews.filter((view) => (view.dateKey || format(normalizeDate(view.createdAt), "yyyy-MM-dd")) === key).length,
      visitors: new Set(
        pageViews
          .filter((view) => (view.dateKey || format(normalizeDate(view.createdAt), "yyyy-MM-dd")) === key)
          .map((view) => view.visitorId)
          .filter(Boolean),
      ).size,
    };
  });

  const popularPages = Object.values(
    pageViews.reduce((acc, view) => {
      const path = view.path || "/";
      if (!acc[path]) {
        acc[path] = {
          path,
          page: view.page || path,
          views: 0,
          visitors: new Set(),
        };
      }
      acc[path].views += 1;
      if (view.visitorId) acc[path].visitors.add(view.visitorId);
      return acc;
    }, {}),
  )
    .map((page) => ({ ...page, visitors: page.visitors.size }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  // Weekly heatmap (7 days x 4 time slots)
  const weeklyHeatmap = Array.from({ length: 4 }, (_, slot) =>
    Array.from({ length: 7 }, (_, day) => {
      const count = bookings.filter((b) => {
        const d = normalizeDate(b.createdAt);
        return d.getDay() === day;
      }).length;
      return { day, slot, value: Math.floor(count / 4) };
    })
  );

  return {
    kpis,
    dailyRevenue,
    monthlyCategoryData,
    categoryRevenueData,
    occupancyRate,
    weeklyHeatmap,
    dailyPageViews,
    popularPages,
    uniqueVisitors,
    pageViewsThisMonth: thisMonthPageViews.length,
  };
};
