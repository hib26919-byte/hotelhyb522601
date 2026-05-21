// C:\Users\velch\Documents\BaelTreeHotels\client\src\pages\Profile.jsx
import { useEffect, useMemo, useState } from "react";
import { where } from "firebase/firestore";
import toast from "react-hot-toast";
import {
  User, Mail, Phone, Lock, Download, Calendar,
  TrendingUp, Star, Clock, CheckCircle2, XCircle,
  AlertCircle, ChevronDown, ChevronUp, Search, Filter
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { useFirestoreCollection } from "../hooks/useFirestore";
import SEOHead from "../components/SEOHead";
import { formatCurrency, formatDate, getUpcomingBookings, normalizeDate } from "../utils/dateHelpers";
import { openInvoiceWindow } from "../utils/invoice";
import { ROOM_CATEGORIES } from "../utils/siteData";

/* ── Stat card ── */
const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div style={{
    padding: "1.25rem 1.5rem",
    borderRadius: 22,
    background: "linear-gradient(145deg, rgba(255,255,255,0.92), rgba(250,248,245,0.85))",
    border: "1px solid rgba(201,168,76,0.2)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    display: "grid", gap: "0.5rem",
    position: "relative", overflow: "hidden",
    transition: "all 0.3s ease",
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(123,26,26,0.12)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: `linear-gradient(135deg, ${color}22, ${color}11)`,
      border: `1px solid ${color}33`,
      display: "grid", placeItems: "center",
    }}>
      <Icon size={18} color={color} />
    </div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "#1a1a1a", lineHeight: 1 }}>
      {value}
    </div>
    <div>
      <div style={{ fontSize: "0.78rem", color: "#2c2c2c", fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: "0.7rem", color: "#8f8579", marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const map = {
    confirmed: { bg: "rgba(51,160,67,0.12)", color: "#1f7c2d", icon: CheckCircle2 },
    pending: { bg: "rgba(201,168,76,0.15)", color: "#7e6200", icon: AlertCircle },
    cancelled: { bg: "rgba(196,57,57,0.12)", color: "#aa2c2c", icon: XCircle },
    completed: { bg: "rgba(40,96,197,0.12)", color: "#214ba2", icon: CheckCircle2 },
  };
  const style = map[status] || { bg: "rgba(150,150,150,0.12)", color: "#666", icon: AlertCircle };
  const Icon = style.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "0.25rem 0.65rem", borderRadius: 999,
      background: style.bg, color: style.color,
      fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize",
    }}>
      <Icon size={11} />
      {status}
    </span>
  );
};

/* ── Tab button ── */
const Tab = ({ label, active, onClick, badge }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: "0.65rem 1.25rem", borderRadius: 999,
      border: active ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(201,168,76,0.15)",
      background: active
        ? "linear-gradient(135deg, rgba(26,26,26,0.95), rgba(123,26,26,0.88))"
        : "rgba(255,255,255,0.6)",
      color: active ? "#e8d5a3" : "#5a5a5a",
      fontFamily: "'Cinzel', serif", fontSize: "0.74rem",
      letterSpacing: "0.08em", textTransform: "uppercase",
      cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
      transition: "all 0.25s ease",
    }}
  >
    {label}
    {badge !== undefined && badge > 0 && (
      <span style={{
        minWidth: 18, height: 18, borderRadius: 999, padding: "0 4px",
        background: active ? "rgba(201,168,76,0.3)" : "rgba(123,26,26,0.12)",
        color: active ? "#e8d5a3" : "#7b1a1a",
        fontSize: "0.65rem", fontWeight: 700,
        display: "grid", placeItems: "center",
      }}>{badge}</span>
    )}
  </button>
);

const Profile = () => {
  const { currentUser, profile, updateProfileDetails, changePassword } = useAuth();
  const [profileValues, setProfileValues] = useState({ name: "", email: "", phone: "" });
  const [passwordValue, setPasswordValue] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const bookingConstraints = useMemo(
    () => (currentUser ? [where("userId", "==", currentUser.uid)] : []),
    [currentUser]
  );
const { data: bookings, loading } = useFirestoreCollection("bookings", {
  fallbackData: [],
  queryConstraints: bookingConstraints,
  enabled: Boolean(currentUser),
  realtime: true,
});

  useEffect(() => {
    if (profile) {
      setProfileValues({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const upcoming = useMemo(() => getUpcomingBookings(bookings), [bookings]);

  const filteredBookings = useMemo(() => {
    let list = [...bookings].sort((a, b) => normalizeDate(b.createdAt) - normalizeDate(a.createdAt));
    if (activeTab !== "all") list = list.filter((b) => b.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        b.id?.toLowerCase().includes(q) ||
        b.roomCategory?.toLowerCase().includes(q) ||
        b.status?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookings, activeTab, search]);

  // Stats
  const totalSpent = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + (b.totalAmount || 0), 0);
  const confirmedCount = bookings.filter(b => b.status === "confirmed").length;
  const completedCount = bookings.filter(b => b.status === "completed").length;

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProfileDetails(profileValues);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.message || "Update failed.");
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    try {
      await changePassword(passwordValue);
      toast.success("Password updated.");
      setPasswordValue("");
    } catch (err) {
      toast.error(err.message || "Please re-authenticate first.");
    }
  };

  return (
    <>
      <SEOHead
        title="My Profile | Bael Tree Hotels"
        description="Manage your profile and bookings at Bael Tree Hotels."
        path="/profile"
      />

      {/* ── Hero header ── */}
      <section style={{
        padding: "7rem 0 0",
        background: "linear-gradient(180deg, rgba(26,26,26,0.03) 0%, transparent 100%)",
      }}>
        <div style={{ width: "var(--container)", margin: "0 auto", padding: "2rem" }}>
          <div style={{
            padding: "2.5rem",
            borderRadius: 32,
            background: "linear-gradient(135deg, #1a1a1a 0%, #2c0a0a 60%, #1a1a1a 100%)",
            color: "#faf8f5",
            display: "flex", alignItems: "center", gap: "2rem",
            flexWrap: "wrap",
            boxShadow: "0 30px 80px rgba(0,0,0,0.2), inset 0 1px 0 rgba(201,168,76,0.2)",
            border: "1px solid rgba(201,168,76,0.15)",
            position: "relative", overflow: "hidden",
          }}>
            {/* BG decoration */}
            <div style={{
              position: "absolute", right: "-3rem", top: "-3rem",
              width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(201,168,76,0.08), transparent 70%)",
            }} />

            {/* Avatar */}
            <div style={{
              width: 90, height: 90, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #c9a84c, #e8d5a3)",
              color: "#1a1a1a", fontFamily: "'Playfair Display', serif",
              fontSize: "2.2rem", fontWeight: 700,
              display: "grid", placeItems: "center",
              boxShadow: "0 0 0 3px rgba(201,168,76,0.3), 0 0 0 6px rgba(201,168,76,0.1)",
            }}>
              {profile?.name?.slice(0, 1) || "G"}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: "0.72rem", color: "rgba(201,168,76,0.7)", letterSpacing: "0.15em", fontFamily: "'Cinzel', serif", textTransform: "uppercase" }}>
                Guest Profile
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", margin: "0.3rem 0 0.25rem", lineHeight: 1.1 }}>
                {profile?.name || "Welcome Back"}
              </h1>
              <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.82rem", color: "rgba(250,248,245,0.6)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Mail size={13} /> {profile?.email}
                </span>
                {profile?.phone && (
                  <span style={{ fontSize: "0.82rem", color: "rgba(250,248,245,0.6)", display: "flex", alignItems: "center", gap: 5 }}>
                    <Phone size={13} /> {profile.phone}
                  </span>
                )}
                <span style={{ fontSize: "0.82rem", color: "rgba(250,248,245,0.5)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={13} /> Member since {formatDate(profile?.createdAt)}
                </span>
              </div>
            </div>

            {/* Loyalty tier */}
            <div style={{
              padding: "1rem 1.5rem", borderRadius: 20, textAlign: "center",
              background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)",
            }}>
              <Star size={20} color="#c9a84c" style={{ margin: "0 auto 4px" }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: "#e8d5a3" }}>
                {completedCount + confirmedCount >= 10 ? "Platinum" : completedCount + confirmedCount >= 5 ? "Gold" : "Silver"}
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(201,168,76,0.6)", letterSpacing: "0.1em" }}>MEMBER</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ width: "var(--container)", margin: "0 auto", padding: "1.5rem 2rem 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }} className="profile-stats-grid">
          <StatCard label="Total Bookings" value={bookings.length} icon={Calendar} color="#7b1a1a" sub="All time" />
          <StatCard label="Total Spent" value={formatCurrency(totalSpent)} icon={TrendingUp} color="#c9a84c" sub="Excluding cancelled" />
          <StatCard label="Upcoming Stays" value={upcoming.length} icon={Clock} color="#73d98f" sub="Check-out in future" />
          <StatCard label="Completed Stays" value={completedCount} icon={CheckCircle2} color="#214ba2" sub="Successfully hosted" />
        </div>
      </section>

      {/* ── Upcoming bookings highlight ── */}
      {upcoming.length > 0 && (
        <section style={{ width: "var(--container)", margin: "0 auto", padding: "1.5rem 2rem 0" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", marginBottom: "1rem" }}>
            Upcoming Stays
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {upcoming.map((b) => (
              <div key={b.id} style={{
                padding: "1.5rem",
                borderRadius: 24,
                background: "linear-gradient(145deg, #1a1a1a, #2c0a0a)",
                border: "1px solid rgba(201,168,76,0.25)",
                color: "#faf8f5", display: "grid", gap: "0.75rem",
                boxShadow: "0 12px 40px rgba(123,26,26,0.15)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "0.7rem", color: "rgba(201,168,76,0.7)", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", textTransform: "capitalize" }}>
                    {b.roomCategory} Room
                  </span>
                  <StatusBadge status={b.status} />
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem" }}>
                  {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#c9a84c", fontWeight: 700 }}>{formatCurrency(b.totalAmount)}</span>
                  <button
                    type="button"
                    onClick={() => openInvoiceWindow(b, ROOM_CATEGORIES.find(r => r.category === b.roomCategory))}
                    style={{
                      padding: "0.4rem 0.85rem", borderRadius: 999,
                      background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
                      color: "#c9a84c", fontSize: "0.75rem", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <Download size={12} /> Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Full booking history ── */}
      <section style={{ width: "var(--container)", margin: "0 auto", padding: "1.5rem 2rem 4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem" }}>Booking History</h2>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "0.55rem 1rem",
              borderRadius: 999, border: "1px solid rgba(201,168,76,0.2)",
              background: "rgba(255,255,255,0.7)",
            }}>
              <Search size={14} color="#8f8579" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search bookings..."
                style={{
                  border: "none", background: "none", outline: "none",
                  fontSize: "0.82rem", color: "#1a1a1a", width: 160,
                }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {[
            { key: "all", label: "All", badge: bookings.length },
            { key: "confirmed", label: "Confirmed", badge: bookings.filter(b => b.status === "confirmed").length },
            { key: "pending", label: "Pending", badge: bookings.filter(b => b.status === "pending").length },
            { key: "completed", label: "Completed", badge: completedCount },
            { key: "cancelled", label: "Cancelled", badge: bookings.filter(b => b.status === "cancelled").length },
          ].map(({ key, label, badge }) => (
            <Tab key={key} label={label} active={activeTab === key} badge={badge} onClick={() => setActiveTab(key)} />
          ))}
        </div>

        {/* Booking list */}
        {loading ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                height: 80, borderRadius: 18,
                background: "linear-gradient(90deg, #f0ece4 25%, #e8e0d4 50%, #f0ece4 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }} />
            ))}
          </div>
        ) : filteredBookings.length ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {filteredBookings.map((b) => {
              const expanded = expandedId === b.id;
              const room = ROOM_CATEGORIES.find(r => r.category === b.roomCategory);
              return (
                <div key={b.id} style={{
                  borderRadius: 22,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,248,245,0.85))",
                  border: "1px solid rgba(201,168,76,0.18)",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                }}>
                  {/* Row header */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : b.id)}
                    style={{
                      width: "100%", padding: "1.1rem 1.5rem",
                      display: "flex", alignItems: "center", gap: "1rem",
                      background: "none", border: "none", cursor: "pointer",
                      textAlign: "left", flexWrap: "wrap",
                    }}
                  >
                    {/* Category chip */}
                    <span style={{
                      padding: "0.25rem 0.7rem", borderRadius: 999,
                      background: "rgba(123,26,26,0.1)", color: "#7b1a1a",
                      fontSize: "0.7rem", fontFamily: "'Cinzel', serif",
                      letterSpacing: "0.08em", textTransform: "capitalize",
                      flexShrink: 0,
                    }}>{b.roomCategory}</span>

                    {/* Dates */}
                    <span style={{ fontSize: "0.88rem", color: "#2c2c2c", fontWeight: 600, flex: 1, minWidth: 180 }}>
                      {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                    </span>

                    {/* Amount */}
                    <span style={{ fontSize: "0.95rem", color: "#c9a84c", fontWeight: 700, marginLeft: "auto" }}>
                      {formatCurrency(b.totalAmount)}
                    </span>

                    {/* Status */}
                    <StatusBadge status={b.status} />

                    {/* Chevron */}
                    <span style={{ color: "#8f8579" }}>
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>

                  {/* Expanded detail */}
                  {expanded && (
                    <div style={{
                      padding: "0 1.5rem 1.25rem",
                      borderTop: "1px solid rgba(201,168,76,0.12)",
                    }}>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: "0.75rem",
                        marginTop: "1rem",
                      }}>
                        {[
                          { label: "Booking ID", value: b.id?.slice(0, 12) + "..." },
                          { label: "Occupancy", value: b.occupancy || "Single", },
                          { label: "Guests", value: b.guests || 1 },
                          { label: "Check-in", value: formatDate(b.checkIn) },
                          { label: "Check-out", value: formatDate(b.checkOut) },
                          { label: "Booked on", value: formatDate(b.createdAt) },
                        ].map(({ label, value }) => (
                          <div key={label} style={{
                            padding: "0.75rem 1rem", borderRadius: 14,
                            background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.1)",
                          }}>
                            <div style={{ fontSize: "0.65rem", color: "#8f8579", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Cinzel', serif" }}>{label}</div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", marginTop: 4 }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => openInvoiceWindow(b, room)}
                          style={{
                            padding: "0.65rem 1.25rem", borderRadius: 999,
                            background: "linear-gradient(135deg, #1a1a1a, #7b1a1a)",
                            color: "#e8d5a3", border: "none", cursor: "pointer",
                            fontSize: "0.8rem", fontFamily: "'Cinzel', serif",
                            letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6,
                          }}
                        >
                          <Download size={14} /> Download Invoice
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: "3rem", textAlign: "center",
            borderRadius: 24,
            background: "rgba(255,255,255,0.6)",
            border: "1px dashed rgba(201,168,76,0.25)",
          }}>
            <Calendar size={32} color="rgba(201,168,76,0.35)" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#5a5a5a", marginBottom: "0.5rem" }}>
              No bookings found
            </h3>
            <p style={{ color: "#8f8579", fontSize: "0.88rem" }}>
              {activeTab !== "all" ? `No ${activeTab} bookings` : "Your reservations will appear here."}
            </p>
          </div>
        )}
      </section>

      {/* ── Edit profile & password ── */}
      <section style={{ width: "var(--container)", margin: "0 auto", padding: "0 2rem 6rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", marginBottom: "1.25rem" }}>
          Account Settings
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="profile-forms-grid">

          {/* Edit profile */}
          <form onSubmit={handleProfileUpdate} style={{
            padding: "1.75rem",
            borderRadius: 28,
            background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(250,248,245,0.85))",
            border: "1px solid rgba(201,168,76,0.18)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
            display: "grid", gap: "1rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.5rem" }}>
              <User size={18} color="#7b1a1a" />
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", margin: 0 }}>Edit Profile</h3>
            </div>

            {[
              { label: "Full Name", key: "name", type: "text", icon: User },
              { label: "Email Address", key: "email", type: "email", icon: Mail, disabled: true },
              { label: "Phone Number", key: "phone", type: "tel", icon: Phone },
            ].map(({ label, key, type, icon: Icon, disabled }) => (
              <label key={key} style={{ display: "grid", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.72rem", color: "#8f8579", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Cinzel', serif" }}>
                  {label}
                </span>
                <div style={{ position: "relative" }}>
                  <Icon size={15} color="#8f8579" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type={type}
                    value={profileValues[key]}
                    disabled={disabled}
                    onChange={e => setProfileValues(p => ({ ...p, [key]: e.target.value }))}
                    style={{
                      width: "100%", padding: "0.85rem 1rem 0.85rem 2.5rem",
                      borderRadius: 14, border: "1px solid rgba(201,168,76,0.2)",
                      background: disabled ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.9)",
                      fontSize: "0.9rem", color: disabled ? "#8f8579" : "#1a1a1a",
                      outline: "none",
                    }}
                    onFocus={e => !disabled && (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(201,168,76,0.2)")}
                  />
                </div>
              </label>
            ))}

            <button type="submit" style={{
              padding: "0.9rem", borderRadius: 999,
              background: "linear-gradient(135deg, #1a1a1a, #7b1a1a)",
              color: "#e8d5a3", border: "none", cursor: "pointer",
              fontFamily: "'Cinzel', serif", fontSize: "0.8rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              boxShadow: "0 8px 24px rgba(123,26,26,0.2)",
              transition: "all 0.3s ease",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}
            >
              Save Changes
            </button>
          </form>

          {/* Change password */}
          <form onSubmit={handlePasswordUpdate} style={{
            padding: "1.75rem",
            borderRadius: 28,
            background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(250,248,245,0.85))",
            border: "1px solid rgba(201,168,76,0.18)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
            display: "grid", gap: "1rem", alignContent: "start",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.5rem" }}>
              <Lock size={18} color="#7b1a1a" />
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", margin: 0 }}>Change Password</h3>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#8f8579", lineHeight: 1.7 }}>
              For security, you may need to sign in again before changing your password.
            </p>

            <label style={{ display: "grid", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#8f8579", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Cinzel', serif" }}>
                New Password
              </span>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="#8f8579" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="password"
                  value={passwordValue}
                  required
                  minLength={6}
                  onChange={e => setPasswordValue(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{
                    width: "100%", padding: "0.85rem 1rem 0.85rem 2.5rem",
                    borderRadius: 14, border: "1px solid rgba(201,168,76,0.2)",
                    background: "rgba(255,255,255,0.9)", fontSize: "0.9rem", color: "#1a1a1a", outline: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                />
              </div>
            </label>

            <button type="submit" style={{
              padding: "0.9rem", borderRadius: 999,
              background: "rgba(201,168,76,0.12)",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#7b1a1a", cursor: "pointer",
              fontFamily: "'Cinzel', serif", fontSize: "0.8rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "all 0.3s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,0.12)"; }}
            >
              Update Password
            </button>
          </form>
        </div>
      </section>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @media (max-width: 900px) {
          .profile-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .profile-forms-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .profile-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
};

export default Profile;