import { useEffect, useState, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, Shield, UserCircle2, Menu, X, BedDouble, Phone, Sparkles } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { useBooking } from "../context/BookingContext";
import { ROOM_CATEGORIES } from "../utils/siteData";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/rooms", label: "Rooms" },
  { to: "/dining", label: "Dining" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [roomsDropdown, setRoomsDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin, logout, profile } = useAuth();
  const { openBooking } = useBooking();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      setScrolled(scrollTop > 36);
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setRoomsDropdown(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setRoomsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenAuth = () => {
    window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "signin" } }));
    setMobileOpen(false);
  };

  const handleBookNow = () => {
    openBooking(ROOM_CATEGORIES[1]);
    setMobileOpen(false);
  };

  const isScrolledAndDark = scrolled;

  return (
    <>
      <header className={`bael-navbar ${scrolled ? "bael-navbar--scrolled" : ""} ${mobileOpen ? "bael-navbar--menu-open" : ""}`}>
        {/* ── Scroll progress bar ── */}
        <div className="bael-navbar__progress" style={{ width: `${scrollProgress}%` }} />

        {/* ── Brand ── */}
        <button
          type="button"
          className="bael-navbar__brand"
          onClick={() => navigate("/")}
          aria-label="Bael Tree Hotels home"
        >
          <div className="bael-navbar__logo" style={{ background: "transparent", border: "none" }}>
            <img src="/logo.webp" alt="Bael Tree Logo" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "16px" }} />
            <div className="bael-navbar__logo-ring" />
          </div>
          <div className="bael-navbar__brand-text">
            <strong>Bael Tree Hotels</strong>
            <small>Madhapur · Hyderabad</small>
          </div>
        </button>

        {/* ── Desktop nav ── */}
        <nav className="bael-navbar__links" aria-label="Primary navigation">
          {NAV_LINKS.map(({ to, label }) => {
            if (label === "Rooms") {
              return (
                <div key={to} ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className={`bael-nav-link ${location.pathname === to ? "active" : ""}`}
                    onClick={() => { navigate(to); setRoomsDropdown(false); }}
                    onMouseEnter={() => { setHoveredLink(label); setRoomsDropdown(true); }}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    {label}
                    <span className="bael-nav-link__dot" />
                  </button>

                  {/* Rooms mega dropdown */}
                  <div
                    className={`bael-rooms-dropdown ${roomsDropdown ? "open" : ""}`}
                    onMouseEnter={() => setRoomsDropdown(true)}
                    onMouseLeave={() => setRoomsDropdown(false)}
                  >
                    <div className="bael-rooms-dropdown__header">
                      <span>Our Room Collection</span>
                    </div>
                    <div className="bael-rooms-dropdown__grid">
                      {ROOM_CATEGORIES.map(room => (
                        <button
                          key={room.id}
                          type="button"
                          className="bael-room-item"
                          onClick={() => { navigate(`/rooms?room=${room.category}`); setRoomsDropdown(false); }}
                        >
                          <div className="bael-room-item__icon">
                            <BedDouble size={16} />
                          </div>
                          <div>
                            <strong>{room.name}</strong>
                            <small>from ₹{room.singlePrice?.toLocaleString("en-IN")}/night</small>
                          </div>
                          <ChevronRight size={14} className="bael-room-item__arrow" />
                        </button>
                      ))}
                    </div>
                    <div className="bael-rooms-dropdown__footer">
                      <button type="button" onClick={handleBookNow}>
                        <Sparkles size={14} />
                        Book Any Room
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) => `bael-nav-link ${isActive ? "active" : ""}`}
                onMouseEnter={() => setHoveredLink(label)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {label}
                <span className="bael-nav-link__dot" />
              </NavLink>
            );
          })}
          {isAdmin && (
            <NavLink to="/admin/dashboard" className="bael-nav-link bael-nav-link--admin">
              <Shield size={14} />
              Admin
            </NavLink>
          )}
        </nav>

        {/* ── Desktop actions ── */}
        <div className="bael-navbar__actions">
          {currentUser ? (
            <>
              <button
                type="button"
                className="bael-btn-profile"
                onClick={() => navigate("/profile")}
                aria-label="Open profile"
              >
                <div className="bael-btn-profile__avatar">
                  {profile?.name?.slice(0, 2).toUpperCase() || "BT"}
                </div>
                <span>{profile?.name?.split(" ")[0] || "Profile"}</span>
              </button>
              <button type="button" className="bael-btn-outline" onClick={logout}>
                Sign Out
              </button>
            </>
          ) : (
            <button type="button" className="bael-btn-outline" onClick={handleOpenAuth}>
              Sign In
            </button>
          )}
          <button type="button" className="bael-btn-gold" onClick={handleBookNow}>
            <span>Book Now</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          type="button"
          className="bael-navbar__hamburger"
          onClick={() => setMobileOpen(p => !p)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span className={`bael-hamburger-line ${mobileOpen ? "open" : ""}`} />
          <span className={`bael-hamburger-line ${mobileOpen ? "open" : ""}`} />
          <span className={`bael-hamburger-line ${mobileOpen ? "open" : ""}`} />
        </button>
      </header>

      {/* ── Mobile drawer ── */}
      <div className={`bael-mobile-drawer ${mobileOpen ? "open" : ""}`} aria-hidden={!mobileOpen}>
        <div className="bael-mobile-drawer__backdrop" onClick={() => setMobileOpen(false)} />
        <div className="bael-mobile-drawer__panel">
          <div className="bael-mobile-drawer__header">
            <div className="bael-navbar__logo" style={{ width: 44, height: 44, background: "transparent", border: "none" }}>
              <img src="/logo.webp" alt="Bael Tree Logo" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "16px" }} />
            </div>
            <div>
              <strong>Bael Tree Hotels</strong>
              <small>Madhapur, Hyderabad</small>
            </div>
          </div>

          <nav className="bael-mobile-drawer__nav">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) => `bael-mobile-nav-link ${isActive ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {label}
                <ChevronRight size={16} />
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin/dashboard"
                className="bael-mobile-nav-link bael-mobile-nav-link--admin"
                onClick={() => setMobileOpen(false)}
              >
                <Shield size={15} />
                Admin Dashboard
                <ChevronRight size={16} />
              </NavLink>
            )}
          </nav>

          <div className="bael-mobile-drawer__actions">
            {currentUser ? (
              <>
                <button type="button" className="bael-btn-profile" onClick={() => { navigate("/profile"); setMobileOpen(false); }} style={{ width: "100%", justifyContent: "center" }}>
                  <div className="bael-btn-profile__avatar">{profile?.name?.slice(0, 2).toUpperCase() || "BT"}</div>
                  {profile?.name?.split(" ")[0] || "My Profile"}
                </button>
                <button type="button" className="bael-btn-outline" onClick={() => { logout(); setMobileOpen(false); }} style={{ width: "100%" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <button type="button" className="bael-btn-outline" onClick={handleOpenAuth} style={{ width: "100%" }}>
                Sign In
              </button>
            )}
            <button type="button" className="bael-btn-gold" onClick={handleBookNow} style={{ width: "100%" }}>
              <Sparkles size={16} />
              Reserve a Room
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="bael-mobile-drawer__contact">
            <Phone size={14} />
            <span>+91-9642325555</span>
          </div>
        </div>
      </div>

      {/* ── Embedded styles ── */}
      <style>{`
        /* ── Base navbar ── */
        .bael-navbar {
          position: fixed;
          top: 0.75rem;
          left: 50%;
          transform: translateX(-50%);
          width: min(1260px, calc(100vw - 2rem));
          z-index: 40;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 1rem;
          border-radius: 20px;
          border: 1px solid rgba(201,168,76,0.15);
          background: rgba(250,248,245,0.5);
          backdrop-filter: blur(12px);
          transition: all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          overflow: visible;
        }

        .bael-navbar--scrolled {
          background: rgba(18,18,18,0.92);
          border-color: rgba(201,168,76,0.22);
          box-shadow: 0 8px 40px rgba(0,0,0,0.28), 0 0 0 1px rgba(201,168,76,0.08);
          top: 0.5rem;
        }

        /* Scroll progress */
        .bael-navbar__progress {
          position: absolute;
          bottom: 0; left: 0;
          height: 2px;
          border-radius: 0 2px 2px 0;
          background: linear-gradient(90deg, #c9a84c, #7b1a1a);
          transition: width 0.1s linear;
          pointer-events: none;
        }

        /* Brand */
        .bael-navbar__brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          transition: opacity 0.2s ease;
        }
        .bael-navbar__brand:hover { opacity: 0.85; }

        .bael-navbar__logo {
          position: relative;
          width: 48px; height: 48px;
          border-radius: 16px;
          background: linear-gradient(145deg, rgba(26,26,26,0.96), rgba(123,26,26,0.92));
          border: 1px solid rgba(201,168,76,0.4);
          display: grid;
          place-items: center;
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #e8d5a3;
          overflow: hidden;
        }

        .bael-navbar__logo-ring {
          position: absolute;
          inset: -4px;
          border-radius: 20px;
          border: 1px solid rgba(201,168,76,0);
          transition: all 0.3s ease;
        }
        .bael-navbar__brand:hover .bael-navbar__logo-ring {
          border-color: rgba(201,168,76,0.35);
          transform: scale(1.08);
        }

        .bael-navbar__brand-text strong {
          display: block;
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          letter-spacing: 0.04em;
          color: #1a1a1a;
          transition: color 0.35s ease;
        }
        .bael-navbar--scrolled .bael-navbar__brand-text strong { color: #faf8f5; }

        .bael-navbar__brand-text small {
          display: block;
          font-size: 0.68rem;
          color: #8f8579;
          letter-spacing: 0.06em;
          margin-top: 1px;
        }
        .bael-navbar--scrolled .bael-navbar__brand-text small { color: rgba(250,248,245,0.55); }

        /* Nav links */
        .bael-navbar__links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-left: auto;
        }

        .bael-nav-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 0.75rem;
          border-radius: 12px;
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(26,26,26,0.82);
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.25s ease;
        }
        .bael-navbar--scrolled .bael-nav-link { color: rgba(250,248,245,0.78); }

        .bael-nav-link:hover {
          background: rgba(201,168,76,0.1);
          color: #1a1a1a;
        }
        .bael-navbar--scrolled .bael-nav-link:hover {
          background: rgba(201,168,76,0.12);
          color: #faf8f5;
        }

        .bael-nav-link.active {
          color: #7b1a1a;
          background: rgba(123,26,26,0.07);
        }
        .bael-navbar--scrolled .bael-nav-link.active {
          color: #c9a84c;
          background: rgba(201,168,76,0.1);
        }

        .bael-nav-link__dot {
          position: absolute;
          bottom: 4px; left: 50%; transform: translateX(-50%);
          width: 4px; height: 4px; border-radius: 50%;
          background: #c9a84c;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .bael-nav-link.active .bael-nav-link__dot { opacity: 1; }

        .bael-nav-link--admin {
          color: #c9a84c !important;
          border: 1px solid rgba(201,168,76,0.25);
        }
        .bael-nav-link--admin:hover {
          background: rgba(201,168,76,0.12) !important;
          border-color: rgba(201,168,76,0.45);
        }

        /* Rooms dropdown */
        .bael-rooms-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          left: 50%;
          transform: translateX(-50%) translateY(-8px);
          width: 300px;
          border-radius: 20px;
          background: rgba(255,255,255,0.97);
          border: 1px solid rgba(201,168,76,0.25);
          box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(201,168,76,0.08);
          opacity: 0;
          pointer-events: none;
          backdrop-filter: blur(20px);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
          z-index: 100;
        }
        .bael-rooms-dropdown.open {
          opacity: 1;
          pointer-events: auto;
          transform: translateX(-50%) translateY(0);
        }

        .bael-rooms-dropdown__header {
          padding: 0.85rem 1rem 0.65rem;
          font-family: 'Cinzel', serif;
          font-size: 0.68rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #7b1a1a;
          border-bottom: 1px solid rgba(201,168,76,0.15);
        }

        .bael-rooms-dropdown__grid {
          padding: 0.5rem;
          display: grid;
          gap: 2px;
        }

        .bael-room-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 0.85rem;
          border-radius: 14px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s ease;
          width: 100%;
        }
        .bael-room-item:hover {
          background: rgba(201,168,76,0.08);
        }
        .bael-room-item__icon {
          width: 32px; height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(26,26,26,0.9), rgba(123,26,26,0.85));
          display: grid; place-items: center;
          color: #c9a84c;
          flex-shrink: 0;
        }
        .bael-room-item strong {
          display: block;
          font-size: 0.85rem;
          font-family: 'Playfair Display', serif;
          color: #1a1a1a;
        }
        .bael-room-item small {
          display: block;
          font-size: 0.72rem;
          color: #8f8579;
          margin-top: 1px;
        }
        .bael-room-item__arrow {
          margin-left: auto;
          color: #c9a84c;
          opacity: 0;
          transform: translateX(-4px);
          transition: all 0.2s ease;
        }
        .bael-room-item:hover .bael-room-item__arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .bael-rooms-dropdown__footer {
          padding: 0.6rem;
          border-top: 1px solid rgba(201,168,76,0.15);
        }
        .bael-rooms-dropdown__footer button {
          width: 100%;
          padding: 0.6rem 1rem;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(201,168,76,0.12), rgba(123,26,26,0.06));
          border: 1px solid rgba(201,168,76,0.25);
          color: #7b1a1a;
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.25s ease;
        }
        .bael-rooms-dropdown__footer button:hover {
          background: linear-gradient(135deg, rgba(201,168,76,0.2), rgba(123,26,26,0.12));
        }

        /* Action buttons */
        .bael-navbar__actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 0;
        }

        .bael-btn-profile {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.45rem 0.85rem 0.45rem 0.45rem;
          border-radius: 999px;
          border: 1px solid rgba(201,168,76,0.25);
          background: rgba(201,168,76,0.06);
          color: #1a1a1a;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .bael-navbar--scrolled .bael-btn-profile { color: #faf8f5; }
        .bael-btn-profile:hover {
          background: rgba(201,168,76,0.14);
          border-color: rgba(201,168,76,0.45);
        }

        .bael-btn-profile__avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e8d5a3, #c9a84c);
          color: #1a1a1a;
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          font-weight: 700;
          display: grid; place-items: center;
        }

        .bael-btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.55rem 1rem;
          border-radius: 999px;
          border: 1px solid rgba(201,168,76,0.35);
          background: rgba(255,255,255,0.5);
          color: #1a1a1a;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
        }
        .bael-navbar--scrolled .bael-btn-outline {
          color: #faf8f5;
          background: rgba(255,255,255,0.05);
        }
        .bael-btn-outline:hover {
          background: rgba(201,168,76,0.1);
          border-color: rgba(201,168,76,0.55);
          transform: translateY(-1px);
        }

        .bael-btn-gold {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.6rem 1.1rem;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, #e8d5a3, #c9a84c);
          color: #1a1a1a;
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(201,168,76,0.3);
          transition: all 0.3s ease;
          white-space: nowrap;
          text-transform: uppercase;
        }
        .bael-btn-gold:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(201,168,76,0.45);
          background: linear-gradient(135deg, #c9a84c, #e8d5a3);
        }

        /* Hamburger */
        .bael-navbar__hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          width: 40px; height: 40px;
          padding: 10px;
          border-radius: 12px;
          background: none;
          border: 1px solid rgba(201,168,76,0.25);
          cursor: pointer;
          margin-left: auto;
          justify-content: center;
          align-items: center;
          transition: all 0.25s ease;
        }
        .bael-navbar__hamburger:hover {
          background: rgba(201,168,76,0.1);
        }

        .bael-hamburger-line {
          display: block;
          width: 20px; height: 2px;
          border-radius: 2px;
          background: #1a1a1a;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
        }
        .bael-navbar--scrolled .bael-hamburger-line { background: #faf8f5; }
        .bael-hamburger-line.open:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .bael-hamburger-line.open:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .bael-hamburger-line.open:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* Mobile drawer */
        .bael-mobile-drawer {
          position: fixed;
          inset: 0;
          z-index: 39;
          pointer-events: none;
        }
        .bael-mobile-drawer.open { pointer-events: auto; }

        .bael-mobile-drawer__backdrop {
          position: absolute;
          inset: 0;
          background: rgba(8,8,8,0.55);
          backdrop-filter: blur(8px);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .bael-mobile-drawer.open .bael-mobile-drawer__backdrop { opacity: 1; }

        .bael-mobile-drawer__panel {
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: min(340px, 88vw);
          background: linear-gradient(180deg, #1a1a1a 0%, #1a0a0a 100%);
          border-left: 1px solid rgba(201,168,76,0.2);
          padding: 1.5rem;
          display: grid;
          align-content: start;
          gap: 1.5rem;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
        }
        .bael-mobile-drawer.open .bael-mobile-drawer__panel {
          transform: translateX(0);
        }

        .bael-mobile-drawer__header {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding-top: env(safe-area-inset-top);
        }
        .bael-mobile-drawer__header strong {
          display: block;
          font-family: 'Cinzel', serif;
          font-size: 0.95rem;
          color: #faf8f5;
          letter-spacing: 0.04em;
        }
        .bael-mobile-drawer__header small {
          display: block;
          font-size: 0.7rem;
          color: rgba(250,248,245,0.5);
        }

        .bael-mobile-drawer__nav {
          display: grid;
          gap: 2px;
        }

        .bael-mobile-nav-link {
          display: flex;
          align-items: center;
          padding: 0.85rem 1rem;
          border-radius: 14px;
          font-family: 'Cinzel', serif;
          font-size: 0.82rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(250,248,245,0.72);
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .bael-mobile-nav-link svg:last-child { margin-left: auto; opacity: 0.4; }
        .bael-mobile-nav-link:hover, .bael-mobile-nav-link.active {
          background: rgba(201,168,76,0.1);
          color: #faf8f5;
          border-color: rgba(201,168,76,0.2);
        }
        .bael-mobile-nav-link.active { color: #c9a84c; }
        .bael-mobile-nav-link--admin {
          color: #c9a84c;
          gap: 0.6rem;
        }

        .bael-mobile-drawer__actions {
          display: grid;
          gap: 0.6rem;
        }

        .bael-mobile-drawer__contact {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.75rem 1rem;
          border-radius: 14px;
          border: 1px solid rgba(201,168,76,0.15);
          color: rgba(250,248,245,0.5);
          font-size: 0.82rem;
        }
        .bael-mobile-drawer__contact svg { color: #c9a84c; }

        /* Responsive */
        @media (max-width: 900px) {
          .bael-navbar__links, .bael-navbar__actions { display: none; }
          .bael-navbar__hamburger { display: flex; }
          .bael-navbar { justify-content: space-between; }
        }
      `}</style>
    </>
  );
};

export default Navbar;