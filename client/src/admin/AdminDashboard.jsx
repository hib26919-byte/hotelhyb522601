// C:\Users\velch\Documents\BaelTreeHotels\client\src\admin\AdminDashboard.jsx
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, RadialBar, RadialBarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { buildDashboardData } from "../utils/dashboard";
import { formatCurrency, formatDate, normalizeDate } from "../utils/dateHelpers";
import { ROOM_CATEGORIES } from "../utils/siteData";
import { useAllRoomsAvailabilityToday } from "../hooks/useRoomAvailability";
import { ROOM_CATEGORY_KEYS, ROOM_CONFIG } from "../utils/roomConfig";
import { useNotificationContext } from "../context/NotificationContext";
import { TrendingUp, TrendingDown, Users, CreditCard, Activity, Calendar, Eye } from "lucide-react";
import GuestGeographyMap from "./components/GuestGeographyMap";
import BookingHeatmap from "./components/BookingHeatmap";

const chartColors = ["#C9A84C", "#7B1A1A", "#4a3000", "#E8D5A3"];

const KpiCard = ({ label, value, trend, icon: Icon, color }) => (
  <div style={{
    padding: "1.5rem",
    borderRadius: 24,
    background: "#ffffff",
    border: "1px solid rgba(201,168,76,0.2)",
    position: "relative", overflow: "hidden",
    transition: "all 0.3s ease",
  }}
    onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(201,168,76,0.5)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(201,168,76,0.2)"; e.currentTarget.style.transform = "none"; }}
  >
    <div style={{
      position: "absolute", top: 0, right: 0, width: 80, height: 80,
      borderRadius: "0 24px 0 80px",
      background: `linear-gradient(135deg, ${color || "#7b1a1a"}22, ${color || "#c9a84c"}11)`,
    }} />
    <div style={{
      width: 40, height: 40, borderRadius: 12, marginBottom: "1rem",
      background: `linear-gradient(135deg, ${color || "#7b1a1a"}33, ${color || "#c9a84c"}22)`,
      border: `1px solid ${color || "#c9a84c"}33`,
      display: "grid", placeItems: "center",
    }}>
      <Icon size={18} color={color || "#c9a84c"} />
    </div>
    <div style={{ fontSize: "0.72rem", color: "#8f8579", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Cinzel', serif", marginBottom: "0.4rem" }}>
      {label}
    </div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "#1a1a1a", lineHeight: 1 }}>
      {value}
    </div>
    {trend !== undefined && (
      <div style={{
        display: "flex", alignItems: "center", gap: 5, marginTop: "0.5rem",
        color: trend >= 0 ? "#2ba150" : "#d03636", fontSize: "0.78rem",
      }}>
        {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {Math.abs(trend)}% vs last month
      </div>
    )}
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div style={{
    padding: "1.5rem",
    borderRadius: 24,
    background: "#ffffff",
    border: "1px solid rgba(201,168,76,0.2)",
  }}>
    <div style={{ marginBottom: "1.25rem" }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", color: "#1a1a1a", margin: 0 }}>
        {title}
      </h3>
      {subtitle && <p style={{ fontSize: "0.76rem", color: "#8f8579", marginTop: 3 }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

const customTooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(201,168,76,0.2)",
  borderRadius: 12,
  padding: "0.6rem 0.9rem",
  color: "#1a1a1a",
  fontSize: "0.82rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
};

const AdminDashboard = () => {
 const { data: bookings } = useFirestoreCollection("bookings", {
  fallbackData: [],
  realtime: true,
});
const { data: rooms } = useFirestoreCollection("rooms", {
  fallbackData: ROOM_CATEGORIES,
  // no realtime — rooms is a static collection, one getDocs fetch is enough
});
const { data: users } = useFirestoreCollection("users", {
  fallbackData: [],
  realtime: true,
});
const { data: pageViews } = useFirestoreCollection("pageViews", {
  fallbackData: [],
  realtime: true,
});
  const { notifications } = useNotificationContext();
  const dashboard = buildDashboardData(bookings, rooms, users, pageViews);
  const availabilityToday = useAllRoomsAvailabilityToday();

  const recentBookings = [...bookings]
    .sort((a, b) => normalizeDate(b.createdAt || 0) - normalizeDate(a.createdAt || 0))
    .slice(0, 8);

  const kpiIcons = [CreditCard, Calendar, Users, Eye];
  const kpiColors = ["#c9a84c", "#7b1a1a", "#73d98f", "#2860c5"];

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }} className="admin-kpi-grid">
        {dashboard.kpis.map((item, i) => (
          <KpiCard
            key={item.label}
            label={item.label}
            value={item.value}
            trend={item.trend}
            icon={kpiIcons[i]}
            color={kpiColors[i]}
          />
        ))}
      </div>

      <div style={{
        padding: "1.5rem",
        borderRadius: 24,
        background: "#ffffff",
        border: "1px solid rgba(201,168,76,0.2)",
      }}>
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", color: "#1a1a1a", margin: 0 }}>
            Live Room Availability
          </h3>
          <p style={{ fontSize: "0.76rem", color: "#8f8579", marginTop: 3 }}>Today's booked inventory by category</p>
        </div>
        <div className="availability-today-grid">
          {ROOM_CATEGORY_KEYS.map((category) => {
            const availability = availabilityToday[category] || {};
            const hasAvailabilityError = Boolean(availability.error);
            const percent = availability.percentOccupied || 0;
            const color = percent >= 100 ? "#d03636" : percent >= 80 ? "#f59e0b" : "#2ba150";
            return (
              <article key={category} className="availability-today-card">
                <div className="availability-today-card__ring">
                  <svg viewBox="0 0 42 42" aria-hidden="true">
                    <circle cx="21" cy="21" r="16" />
                    <circle
                      cx="21"
                      cy="21"
                      r="16"
                      style={{
                        stroke: color,
                        strokeDasharray: `${percent} 100`,
                      }}
                    />
                  </svg>
                  <b>{availability.loading || hasAvailabilityError ? "..." : `${percent}%`}</b>
                </div>
                <div>
                  <strong>{ROOM_CONFIG[category].label}</strong>
                  <span>{availability.occupied ?? 0} / {availability.total ?? ROOM_CONFIG[category].total} rooms occupied</span>
                  <small
                    className={`availability-today-card__chip ${
                      availability.isFull
                        ? "is-full"
                        : hasAvailabilityError
                          ? "is-error"
                        : availability.isLimited
                          ? "is-limited"
                          : "is-open"
                    }`}
                  >
                    {availability.loading
                      ? "Checking..."
                      : hasAvailabilityError
                        ? "Unavailable"
                      : availability.isFull
                        ? "Fully booked"
                        : `${availability.available} available`}
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Page views */}
      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: "1rem" }} className="admin-charts-row">
        <ChartCard
          title="Page Views"
          subtitle={`${dashboard.pageViewsThisMonth} views this month · ${dashboard.uniqueVisitors} unique visitors`}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dashboard.dailyPageViews}>
              <defs>
                <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2860c5" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#2860c5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" stroke="rgba(0,0,0,0.15)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(0,0,0,0.15)" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Area type="monotone" dataKey="views" name="Views" stroke="#2860c5" strokeWidth={2} fill="url(#viewsFill)" />
              <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#c9a84c" strokeWidth={1.5} fillOpacity={0} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Pages" subtitle="Most viewed public routes">
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {dashboard.popularPages.map((page, index) => (
              <div key={page.path} style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.7rem 0",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
              }}>
                <span style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(201,168,76,0.12)",
                  color: "#7b1a1a",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                }}>{index + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", color: "#1a1a1a", fontSize: "0.86rem" }}>{page.page}</strong>
                  <small style={{ color: "#8f8579" }}>{page.path}</small>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ color: "#2860c5" }}>{page.views}</strong>
                  <small style={{ display: "block", color: "#8f8579" }}>{page.visitors} visitors</small>
                </div>
              </div>
            ))}
            {!dashboard.popularPages.length && (
              <p style={{ color: "#8f8579", fontSize: "0.82rem" }}>Page views will appear after visitors browse the public site.</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: "1rem" }} className="admin-charts-row">
        <ChartCard title="Revenue Trend" subtitle="This month vs last month · last 30 days">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dashboard.dailyRevenue}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" stroke="rgba(0,0,0,0.15)" tick={{ fontSize: 10 }} interval={6} />
              <YAxis stroke="rgba(0,0,0,0.15)" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Area type="monotone" dataKey="thisMonth" stroke="#C9A84C" strokeWidth={2} fill="url(#revFill)" />
              <Area type="monotone" dataKey="lastMonth" stroke="#7B1A1A" strokeWidth={1.5} fillOpacity={0} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Mix" subtitle="By room category">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={dashboard.categoryRevenueData} dataKey="value" outerRadius={85} innerRadius={52} paddingAngle={3}>
                {dashboard.categoryRevenueData.map((_, i) => (
                  <Cell key={i} fill={chartColors[i % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={customTooltipStyle} formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginTop: "0.75rem" }}>
            {dashboard.categoryRevenueData.map((d, i) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#5a5a5a" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: chartColors[i], flexShrink: 0 }} />
                {d.name}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Maps and Heatmap row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="admin-charts-row2">
        <ChartCard title="Guest Demographics" subtitle="Geographical origin of active bookings">
          <GuestGeographyMap />
        </ChartCard>

        <ChartCard title="Booking Heatmap" subtitle="Activity distribution across the week">
          <BookingHeatmap data={dashboard.weeklyHeatmap} />
        </ChartCard>
      </div>

      {/* Charts row 3 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 0.5fr", gap: "1rem" }} className="admin-charts-row2">
        <ChartCard title="Monthly Bookings" subtitle="By room category · last 6 months">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashboard.monthlyCategoryData} barSize={8} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" stroke="rgba(0,0,0,0.15)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(0,0,0,0.15)" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="standard" fill="#C9A84C" radius={[3, 3, 0, 0]} />
              <Bar dataKey="executive" fill="#7B1A1A" radius={[3, 3, 0, 0]} />
              <Bar dataKey="premium" fill="#E8D5A3" radius={[3, 3, 0, 0]} />
              <Bar dataKey="suite" fill="rgba(0,0,0,0.1)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Today's Occupancy" subtitle="Active rooms vs inventory">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart
                cx="50%" cy="85%"
                innerRadius="55%" outerRadius="95%"
                barSize={16} startAngle={180} endAngle={0}
                data={[{ name: "Occupancy", value: dashboard.occupancyRate, fill: "#C9A84C" }]}
              >
                <RadialBar minAngle={10} background={{ fill: "rgba(0,0,0,0.04)" }} clockWise dataKey="value" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center", marginTop: "-1rem" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", color: "#c9a84c", lineHeight: 1 }}>
                {dashboard.occupancyRate}%
              </div>
              <div style={{ fontSize: "0.7rem", color: "#8f8579", marginTop: 4 }}>Occupied</div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "1rem" }} className="admin-bottom-row">
        {/* Recent bookings */}
        <div style={{
          padding: "1.5rem", borderRadius: 24,
          background: "#ffffff",
          border: "1px solid rgba(201,168,76,0.2)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", color: "#1a1a1a", margin: 0 }}>
              Recent Bookings
            </h3>
            <span style={{ fontSize: "0.72rem", color: "#8f8579" }}>Last 8 reservations</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr>
                  {["Guest", "Room", "Check-in", "Amount", "Status"].map(h => (
                    <th key={h} style={{
                      padding: "0.5rem 0.75rem", textAlign: "left",
                      color: "#8f8579", fontWeight: 500,
                      fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                    <td style={{ padding: "0.7rem 0.75rem", color: "#1a1a1a" }}>{b.userName}</td>
                    <td style={{ padding: "0.7rem 0.75rem", color: "#5a5a5a", textTransform: "capitalize" }}>{b.roomCategory}</td>
                    <td style={{ padding: "0.7rem 0.75rem", color: "#5a5a5a" }}>{formatDate(b.checkIn)}</td>
                    <td style={{ padding: "0.7rem 0.75rem", color: "#c9a84c", fontWeight: 600 }}>{formatCurrency(b.totalAmount)}</td>
                    <td style={{ padding: "0.7rem 0.75rem" }}>
                      <span style={{
                        padding: "0.2rem 0.65rem", borderRadius: 999,
                        fontSize: "0.7rem", fontWeight: 600, textTransform: "capitalize",
                        background: b.status === "confirmed" ? "rgba(43,161,80,0.12)" : b.status === "cancelled" ? "rgba(208,54,54,0.12)" : "rgba(201,168,76,0.12)",
                        color: b.status === "confirmed" ? "#2ba150" : b.status === "cancelled" ? "#d03636" : "#c9a84c",
                      }}>{b.status}</span>
                    </td>
                  </tr>
                ))}
                {!recentBookings.length && (
                  <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#8f8579" }}>No bookings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity feed */}
        <div style={{
          padding: "1.5rem", borderRadius: 24,
          background: "#ffffff",
          border: "1px solid rgba(201,168,76,0.2)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", color: "#1a1a1a", margin: 0 }}>
              Live Feed
            </h3>
            <Activity size={15} color="#c9a84c" />
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {notifications.slice(0, 7).map((n) => (
              <div key={n.id} style={{
                display: "flex", gap: "0.75rem", alignItems: "flex-start",
                padding: "0.7rem", borderRadius: 14,
                background: n.isRead ? "transparent" : "rgba(201,168,76,0.05)",
                border: `1px solid ${n.isRead ? "transparent" : "rgba(201,168,76,0.2)"}`,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                  background: n.type === "cancellation" ? "#d03636" : n.type === "new_user" ? "#2ba150" : "#c9a84c",
                }} />
                <div>
                  <div style={{ fontSize: "0.78rem", color: "#1a1a1a", fontWeight: 500 }}>{n.message}</div>
                  <div style={{ fontSize: "0.67rem", color: "#8f8579", marginTop: 2 }}>
                    {formatDate(n.createdAt, "dd MMM, hh:mm a")}
                  </div>
                </div>
              </div>
            ))}
            {!notifications.length && (
              <div style={{ textAlign: "center", color: "#8f8579", fontSize: "0.82rem", padding: "1rem" }}>
                No activity yet
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .admin-kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .admin-charts-row, .admin-charts-row2, .admin-bottom-row { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 700px) {
          .admin-kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
