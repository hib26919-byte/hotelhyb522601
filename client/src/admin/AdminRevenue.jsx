import { useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import { Download, FileText, Printer, TrendingDown, TrendingUp } from "lucide-react";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { db } from "../utils/firebase";
import { downloadCsv } from "../utils/dashboard";
import { formatCurrency, formatDate, getNightsBetween, normalizeDate } from "../utils/dateHelpers";
import { ROOM_TOTALS } from "../utils/roomConfig";

const CATEGORIES = ["standard", "executive", "premium", "suite"];
const CATEGORY_COLORS = {
  standard: "#e8d5a3",
  executive: "#c9a84c",
  premium: "#7b1a1a",
  suite: "#3a0d0d",
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const dateKey = (date) => formatDate(date, "yyyy-MM-dd");
const monthKey = (date) => formatDate(date, "yyyy-MM");
const isRevenueBooking = (booking) => booking.status !== "cancelled";
const amountOf = (booking) => Number(booking.totalAmount || 0);

const periodTotal = (bookings, start, end) =>
  bookings
    .filter((booking) => {
      const date = normalizeDate(booking.createdAt || booking.checkIn);
      return date >= start && date <= end && isRevenueBooking(booking);
    })
    .reduce((sum, booking) => sum + amountOf(booking), 0);

const periodBookings = (bookings, start, end) =>
  bookings.filter((booking) => {
    const date = normalizeDate(booking.createdAt || booking.checkIn);
    return date >= start && date <= end && isRevenueBooking(booking);
  });

const getChange = (current, previous) =>
  previous ? Math.round(((current - previous) / previous) * 100) : current ? 100 : 0;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
const startOfWeek = (date) => {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
};
const endOfWeek = (date) => {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);
const endOfYear = (date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const ChartShell = ({ title, children, action }) => (
  <section className="admin-card admin-card--chart revenue-chart-card">
    <div className="admin-card__header">
      <h3>{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

const SummaryCard = ({ label, value, change }) => (
  <article className="admin-card revenue-summary-card">
    <span>{label}</span>
    <strong>{formatCurrency(value)}</strong>
    <small className={change >= 0 ? "trend-positive" : "trend-negative"}>
      {change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {Math.abs(change)}% vs previous period
    </small>
  </article>
);

const AdminRevenue = () => {
  const { data: bookings } = useFirestoreCollection("bookings", {
    fallbackData: [],
    realtime: true,
  });
  const { data: monthlyReports } = useFirestoreCollection("monthlyReports", {
    fallbackData: [],
    realtime: true,
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [gstPercentage, setGstPercentage] = useState(18);
  const [sortKey, setSortKey] = useState("date");

  const now = new Date();
  const summary = useMemo(() => {
    const today = periodTotal(bookings, startOfDay(now), endOfDay(now));
    const yesterday = periodTotal(bookings, startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)), endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)));
    const week = periodTotal(bookings, startOfWeek(now), endOfWeek(now));
    const previousWeekDate = new Date(now);
    previousWeekDate.setDate(previousWeekDate.getDate() - 7);
    const previousWeek = periodTotal(bookings, startOfWeek(previousWeekDate), endOfWeek(previousWeekDate));
    const month = periodTotal(bookings, startOfMonth(now), endOfMonth(now));
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = periodTotal(bookings, startOfMonth(previousMonthDate), endOfMonth(previousMonthDate));
    const year = periodTotal(bookings, startOfYear(now), endOfYear(now));
    const previousYearDate = new Date(now.getFullYear() - 1, 0, 1);
    const previousYear = periodTotal(bookings, startOfYear(previousYearDate), endOfYear(previousYearDate));
    const allTime = bookings.filter(isRevenueBooking).reduce((sum, booking) => sum + amountOf(booking), 0);

    return [
      { label: "Today's Revenue", value: today, change: getChange(today, yesterday) },
      { label: "This Week", value: week, change: getChange(week, previousWeek) },
      { label: "This Month", value: month, change: getChange(month, previousMonth) },
      { label: "This Year", value: year, change: getChange(year, previousYear) },
      { label: "All Time", value: allTime, change: 0 },
    ];
  }, [bookings, now]);

  const dailyRevenue = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const currentMonth = month - 1;
    const previousMonth = currentMonth - 1;
    const days = daysInMonth(year, currentMonth);

    return Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const currentKey = dateKey(new Date(year, currentMonth, day));
      const previousKey = dateKey(new Date(year, previousMonth, day));
      return {
        day,
        current: bookings
          .filter((booking) => dateKey(normalizeDate(booking.createdAt || booking.checkIn)) === currentKey && isRevenueBooking(booking))
          .reduce((sum, booking) => sum + amountOf(booking), 0),
        previous: bookings
          .filter((booking) => dateKey(normalizeDate(booking.createdAt || booking.checkIn)) === previousKey && isRevenueBooking(booking))
          .reduce((sum, booking) => sum + amountOf(booking), 0),
      };
    });
  }, [bookings, selectedMonth]);

  const monthlyCategoryRevenue = useMemo(() => {
    const year = Number(selectedYear);
    return MONTHS.map((name, monthIndex) => {
      const row = { name };
      CATEGORIES.forEach((category) => {
        row[category] = bookings
          .filter((booking) => {
            const date = normalizeDate(booking.createdAt || booking.checkIn);
            return date.getFullYear() === year && date.getMonth() === monthIndex && booking.roomCategory === category && isRevenueBooking(booking);
          })
          .reduce((sum, booking) => sum + amountOf(booking), 0);
      });
      return row;
    });
  }, [bookings, selectedYear]);

  const currentMonthMix = useMemo(() => {
    const key = monthKey(new Date());
    return CATEGORIES.map((category) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: bookings
        .filter((booking) => booking.roomCategory === category && monthKey(normalizeDate(booking.createdAt || booking.checkIn)) === key && isRevenueBooking(booking))
        .reduce((sum, booking) => sum + amountOf(booking), 0),
      color: CATEGORY_COLORS[category],
    }));
  }, [bookings]);

  const cumulativeRevenue = useMemo(() => {
    const year = new Date().getFullYear();
    let running = 0;
    return MONTHS.map((name, index) => {
      const total = bookings
        .filter((booking) => {
          const date = normalizeDate(booking.createdAt || booking.checkIn);
          return date.getFullYear() === year && date.getMonth() === index && isRevenueBooking(booking);
        })
        .reduce((sum, booking) => sum + amountOf(booking), 0);
      running += total;
      return { name, revenue: running };
    });
  }, [bookings]);

  const tableRows = useMemo(() => {
    const from = fromDate ? startOfDay(new Date(fromDate)) : new Date(0);
    const to = toDate ? endOfDay(new Date(`${toDate}T00:00:00`)) : new Date(8640000000000000);
    const grouped = new Map();

    bookings.forEach((booking) => {
      const created = normalizeDate(booking.createdAt || booking.checkIn);
      if (created < from || created > to || !isRevenueBooking(booking)) return;
      const key = dateKey(created);
      if (!grouped.has(key)) {
        grouped.set(key, {
          date: key,
          bookings: 0,
          standard: 0,
          executive: 0,
          premium: 0,
          suite: 0,
          total: 0,
        });
      }
      const row = grouped.get(key);
      const category = CATEGORIES.includes(booking.roomCategory) ? booking.roomCategory : "standard";
      row.bookings += 1;
      row[category] += amountOf(booking);
      row.total += amountOf(booking);
    });

    return [...grouped.values()]
      .map((row) => ({
        ...row,
        gst: Math.round((row.total * gstPercentage) / 100),
        net: row.total - Math.round((row.total * gstPercentage) / 100),
      }))
      .sort((a, b) => {
        if (sortKey === "bookings") return b.bookings - a.bookings;
        if (sortKey === "total") return b.total - a.total;
        if (sortKey === "net") return b.net - a.net;
        return b.date.localeCompare(a.date);
      });
  }, [bookings, fromDate, gstPercentage, sortKey, toDate]);

  const grandTotal = tableRows.reduce((sum, row) => sum + row.total, 0);
  const grandGst = tableRows.reduce((sum, row) => sum + row.gst, 0);
  const grandNet = tableRows.reduce((sum, row) => sum + row.net, 0);

  const yearOptions = useMemo(() => {
    const years = new Set([String(new Date().getFullYear())]);
    bookings.forEach((booking) => years.add(String(normalizeDate(booking.createdAt || booking.checkIn).getFullYear())));
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [bookings]);

  const monthOptions = useMemo(() => {
    const months = new Set([monthKey(new Date())]);
    bookings.forEach((booking) => months.add(monthKey(normalizeDate(booking.createdAt || booking.checkIn))));
    return [...months].sort().reverse();
  }, [bookings]);

  const generateMonthlyReport = async (key) => {
    const [year, month] = key.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = endOfMonth(start);
    const monthBookings = periodBookings(bookings, start, end);
    const revenueByCategory = {};
    const bookingsByCategory = {};
    CATEGORIES.forEach((category) => {
      const categoryBookings = monthBookings.filter((booking) => booking.roomCategory === category);
      bookingsByCategory[category] = categoryBookings.length;
      revenueByCategory[category] = categoryBookings.reduce((sum, booking) => sum + amountOf(booking), 0);
    });
    const dayTotals = monthBookings.reduce((acc, booking) => {
      const keyDate = dateKey(normalizeDate(booking.createdAt || booking.checkIn));
      acc[keyDate] = (acc[keyDate] || 0) + amountOf(booking);
      return acc;
    }, {});
    const peak = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0] || [dateKey(start), 0];
    const occupiedNights = monthBookings.reduce((sum, booking) => sum + getNightsBetween(booking.checkIn, booking.checkOut), 0);
    const inventory = Object.values(ROOM_TOTALS).reduce((sum, value) => sum + value, 0);

    try {
      await setDoc(doc(db, "monthlyReports", key), {
        month: key,
        totalRevenue: monthBookings.reduce((sum, booking) => sum + amountOf(booking), 0),
        totalBookings: monthBookings.length,
        avgOccupancyRate: Math.round((occupiedNights / (inventory * daysInMonth(year, month - 1))) * 100),
        revenueByCategory,
        bookingsByCategory,
        cancellations: bookings.filter((booking) => {
          const date = normalizeDate(booking.createdAt || booking.checkIn);
          return date >= start && date <= end && booking.status === "cancelled";
        }).length,
        newUsers: 0,
        avgStayDuration: monthBookings.length ? Math.round(occupiedNights / monthBookings.length) : 0,
        peakDay: peak[0],
        peakRevenue: peak[1],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success("Monthly report generated.");
    } catch (error) {
      toast.error(error.message || "Unable to generate report.");
    }
  };

  const exportRows = () => {
    downloadCsv("bael-tree-revenue.csv", tableRows);
  };

  return (
    <div className="admin-stack admin-revenue-page">
      <div className="admin-tab-row">
        <button type="button" className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
          Overview
        </button>
        <button type="button" className={activeTab === "reports" ? "active" : ""} onClick={() => setActiveTab("reports")}>
          Monthly Reports
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          <section className="revenue-summary-grid">
            {summary.map((item) => (
              <SummaryCard key={item.label} {...item} />
            ))}
          </section>

          <div className="revenue-chart-grid">
            <ChartShell
              title="Daily Revenue"
              action={
                <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
                  {monthOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              }
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="current" stroke="#7b1a1a" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="previous" stroke="#c9a84c" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </ChartShell>

            <ChartShell
              title="Revenue by Category"
              action={
                <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              }
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyCategoryRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  {CATEGORIES.map((category) => (
                    <Bar key={category} dataKey={category} stackId="revenue" fill={CATEGORY_COLORS[category]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartShell>

            <ChartShell title="Current Month Mix">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={currentMonthMix} dataKey="value" innerRadius={58} outerRadius={92} paddingAngle={3}>
                    {currentMonthMix.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </ChartShell>

            <ChartShell title={`Cumulative ${new Date().getFullYear()} Revenue`}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={cumulativeRevenue}>
                  <defs>
                    <linearGradient id="cumulativeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={3} fill="url(#cumulativeFill)" />
                </AreaChart>
              </ResponsiveContainer>
              <p className="revenue-annotation">
                You've earned {formatCurrency(cumulativeRevenue.at(-1)?.revenue || 0)} so far this year.
              </p>
            </ChartShell>
          </div>

          <section className="admin-card">
            <div className="admin-card__header">
              <div>
                <h3>Revenue Table</h3>
                <span>Daily revenue grouped from live bookings.</span>
              </div>
              <div className="table-actions">
                <button type="button" className="btn btn-outline" onClick={exportRows}>
                  <Download size={15} /> Download CSV
                </button>
                <button type="button" className="btn btn-gold" onClick={() => window.print()}>
                  <Printer size={15} /> Print / PDF
                </button>
              </div>
            </div>

            <div className="admin-toolbar">
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
              <select value={gstPercentage} onChange={(event) => setGstPercentage(Number(event.target.value))}>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST</option>
              </select>
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
                <option value="date">Sort by date</option>
                <option value="bookings">Sort by bookings</option>
                <option value="total">Sort by total</option>
                <option value="net">Sort by net</option>
              </select>
            </div>

            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Bookings</th>
                    <th>Standard</th>
                    <th>Executive</th>
                    <th>Premium</th>
                    <th>Suite</th>
                    <th>Total</th>
                    <th>GST ({gstPercentage}%)</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>{row.bookings}</td>
                      <td>{formatCurrency(row.standard)}</td>
                      <td>{formatCurrency(row.executive)}</td>
                      <td>{formatCurrency(row.premium)}</td>
                      <td>{formatCurrency(row.suite)}</td>
                      <td>{formatCurrency(row.total)}</td>
                      <td>{formatCurrency(row.gst)}</td>
                      <td>{formatCurrency(row.net)}</td>
                    </tr>
                  ))}
                  {!tableRows.length && (
                    <tr>
                      <td colSpan="9">No revenue data available for the selected range.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Grand Total</td>
                    <td>{tableRows.reduce((sum, row) => sum + row.bookings, 0)}</td>
                    <td colSpan="4" />
                    <td>{formatCurrency(grandTotal)}</td>
                    <td>{formatCurrency(grandGst)}</td>
                    <td>{formatCurrency(grandNet)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}

      {activeTab === "reports" && (
        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <h3>Monthly Reports</h3>
              <span>Saved history in /monthlyReports documents.</span>
            </div>
            <button type="button" className="btn btn-gold" onClick={() => generateMonthlyReport(selectedMonth)}>
              <FileText size={15} /> Generate {selectedMonth}
            </button>
          </div>
          <div className="admin-toolbar">
            <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
              {monthOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Revenue</th>
                  <th>Bookings</th>
                  <th>Occupancy %</th>
                  <th>Cancellations</th>
                  <th>Avg Stay</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...monthlyReports].sort((a, b) => (b.month || "").localeCompare(a.month || "")).map((report) => (
                  <tr key={report.id}>
                    <td>{report.month}</td>
                    <td>{formatCurrency(report.totalRevenue)}</td>
                    <td>{report.totalBookings}</td>
                    <td>{report.avgOccupancyRate}%</td>
                    <td>{report.cancellations}</td>
                    <td>{report.avgStayDuration} nights</td>
                    <td>
                      <button type="button" className="btn btn-outline" onClick={() => generateMonthlyReport(report.month)}>
                        Regenerate
                      </button>
                    </td>
                  </tr>
                ))}
                {!monthlyReports.length && (
                  <tr>
                    <td colSpan="7">No monthly reports yet. Generate one for the selected month.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminRevenue;
