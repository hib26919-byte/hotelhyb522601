// C:\Users\velch\Documents\BaelTreeHotels\client\src\admin\AdminLayout.jsx
import { useState } from "react";
import {
  Bell, CreditCard, GalleryHorizontal, LayoutDashboard,
  PartyPopper, Settings, Users, Warehouse, ChevronRight,
  LogOut, Menu, X, TrendingUp
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useNotificationContext } from "../context/NotificationContext";
import GlobalImageUploader from "./components/GlobalImageUploader";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Overview & analytics" },
  { to: "/admin/bookings", label: "Bookings", icon: CreditCard, desc: "Manage reservations" },
  { to: "/admin/rooms", label: "Rooms", icon: Warehouse, desc: "Room inventory" },
  { to: "/admin/gallery", label: "Gallery", icon: GalleryHorizontal, desc: "Media library" },
  { to: "/admin/festival", label: "Festival Banner", icon: PartyPopper, desc: "Promotions" },
  { to: "/admin/users", label: "Users", icon: Users, desc: "Guest management" },
  { to: "/admin/revenue", label: "Revenue", icon: TrendingUp, desc: "Financial reports" },
  { to: "/admin/notifications", label: "Notifications", icon: Bell, desc: "Alerts & updates" },
  { to: "/admin/settings", label: "Settings", icon: Settings, desc: "Configuration" },
];

const AdminLayout = () => {
  const { profile, logout } = useAuth();
  const { unreadCount } = useNotificationContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const currentPage = navItems.find((n) => location.pathname.startsWith(n.to));

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#f4f1eb",
      color: "#1a1a1a",
      fontFamily: "'Lato', sans-serif",
    }}>

      {/* ── Sidebar Overlay (Mobile) ── */}
      <div 
        className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        flexShrink: 0,
        background: "#ffffff",
        borderRight: "1px solid rgba(201,168,76,0.2)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        position: "sticky",
        top: 0,
        height: "100vh",
        zIndex: 30,
      }}>

        {/* Brand */}
        <div style={{
          padding: sidebarOpen ? "1.5rem 1.25rem 1rem" : "1.5rem 0 1rem",
          borderBottom: "1px solid rgba(201,168,76,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarOpen ? "space-between" : "center",
          gap: "0.75rem",
        }}>
          {sidebarOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                background: "transparent",
                border: "none",
                display: "grid", placeItems: "center",
              }}>
                <img src="/logo.webp" alt="Bael Tree Logo" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 14 }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.88rem", color: "#c9a84c", letterSpacing: "0.04em" }}>
                  Bael Tree
                </div>
                <div style={{ fontSize: "0.65rem", color: "#8f8579", letterSpacing: "0.1em" }}>
                  ADMIN CONSOLE
                </div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen((p) => !p)}
            style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "#ffffff", border: "1px solid rgba(201,168,76,0.2)",
              color: "#5a5a5a", cursor: "pointer",
              display: "grid", placeItems: "center", transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.05)"}
            onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.75rem", overflowY: "auto", overflowX: "hidden" }}>
          {navItems.map(({ to, label, icon: Icon, desc }) => {
            const isActive = location.pathname.startsWith(to);
            const hasNotif = label === "Notifications" && unreadCount > 0;
            return (
              <NavLink
                key={to}
                to={to}
                title={!sidebarOpen ? label : undefined}
                style={{
                  display: "flex", alignItems: "center",
                  gap: "0.75rem",
                  padding: sidebarOpen ? "0.75rem 0.9rem" : "0.75rem 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  borderRadius: 14, marginBottom: 2,
                  textDecoration: "none",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(201,168,76,0.2)"
                    : "1px solid transparent",
                  color: isActive ? "#1a1a1a" : "#8f8579",
                  transition: "all 0.25s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(201,168,76,0.05)";
                    e.currentTarget.style.color = "#1a1a1a";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#8f8579";
                  }
                }}
              >
                {isActive && (
                  <div style={{
                    position: "absolute", left: 0, top: "20%", bottom: "20%",
                    width: 3, borderRadius: "0 2px 2px 0",
                    background: "linear-gradient(180deg, #c9a84c, #7b1a1a)",
                  }} />
                )}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Icon size={18} color={isActive ? "#c9a84c" : "currentColor"} />
                  {hasNotif && !sidebarOpen && (
                    <span style={{
                      position: "absolute", top: -4, right: -4,
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#d03636",
                    }} />
                  )}
                </div>
                {sidebarOpen && (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: isActive ? 600 : 400 }}>{label}</div>
                      {!isActive && (
                        <div style={{ fontSize: "0.67rem", color: "rgba(250,248,245,0.35)", marginTop: 1 }}>{desc}</div>
                      )}
                    </div>
                    {hasNotif && (
                      <span style={{
                        minWidth: 20, height: 20, borderRadius: 999,
                        background: "#d03636", color: "#fff",
                        fontSize: "0.65rem", fontWeight: 700,
                        display: "grid", placeItems: "center", padding: "0 5px",
                      }}>{unreadCount}</span>
                    )}
                    {isActive && <ChevronRight size={14} color="rgba(201,168,76,0.6)" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User card */}
        <div style={{
          padding: sidebarOpen ? "1rem 1.25rem" : "1rem 0",
          borderTop: "1px solid rgba(201,168,76,0.2)",
          display: "flex", alignItems: "center",
          gap: "0.75rem",
          justifyContent: sidebarOpen ? "flex-start" : "center",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #e8d5a3, #c9a84c)",
            color: "#1a1a1a", fontFamily: "'Cinzel', serif",
            fontSize: "0.72rem", fontWeight: 700,
            display: "grid", placeItems: "center",
          }}>
            {profile?.name?.slice(0, 2).toUpperCase() || "AD"}
          </div>
          {sidebarOpen && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a1a1a" }}>
                  {profile?.name || "Administrator"}
                </div>
                <div style={{ fontSize: "0.68rem", color: "#8f8579", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile?.email}
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "#ffffff", border: "1px solid rgba(208,54,54,0.2)",
                  color: "#d03636", cursor: "pointer",
                  display: "grid", placeItems: "center", flexShrink: 0,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(208,54,54,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid rgba(201,168,76,0.2)",
          background: "rgba(255,255,255,0.95)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 20,
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button className="admin-mobile-toggle" onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#1a1a1a", display: "grid", placeItems: "center" }}>
              <Menu size={24} />
            </button>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#c9a84c", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>
                Bael Tree Hotels
              </div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.6rem", color: "#1a1a1a", margin: 0, lineHeight: 1.1,
              }}>
                {currentPage?.label || "Dashboard"}
              </h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Notifications bell */}
            <div style={{ position: "relative" }}>
              <NavLink to="/admin/notifications" style={{
                width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center",
                background: "#ffffff", border: "1px solid rgba(201,168,76,0.2)",
                color: "#5a5a5a", textDecoration: "none",
              }}>
                <Bell size={17} />
              </NavLink>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: -3, right: -3,
                  minWidth: 18, height: 18, borderRadius: 999,
                  background: "#d03636", color: "#fff",
                  fontSize: "0.6rem", fontWeight: 700,
                  display: "grid", placeItems: "center",
                  padding: "0 4px",
                }}>{unreadCount}</span>
              )}
            </div>

            {/* Avatar */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.45rem 0.85rem 0.45rem 0.45rem",
              borderRadius: 999, background: "#ffffff",
              border: "1px solid rgba(201,168,76,0.2)",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, #e8d5a3, #c9a84c)",
                color: "#1a1a1a", fontFamily: "'Cinzel', serif",
                fontSize: "0.65rem", fontWeight: 700,
                display: "grid", placeItems: "center",
              }}>
                {profile?.name?.slice(0, 2).toUpperCase() || "AD"}
              </div>
              <span style={{ fontSize: "0.8rem", color: "#1a1a1a", fontWeight: 500 }}>
                {profile?.name?.split(" ")[0] || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-main-content" style={{ flex: 1, padding: "1.5rem", overflowY: "auto", overflowX: "hidden" }}>
          <Outlet />
        </main>
      </div>

      <GlobalImageUploader />

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 999px; }

        .admin-sidebar { width: 72px; }
        .admin-sidebar.open { width: 280px; }
        .admin-sidebar-overlay { display: none; }
        .admin-mobile-toggle { display: none; }

        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed !important;
            transform: translateX(-100%);
            width: 280px !important;
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-sidebar-overlay.open {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(4px);
            z-index: 25;
          }
          .admin-main-content {
            padding: 1rem !important;
          }
          .admin-mobile-toggle {
            display: block;
            margin-right: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;