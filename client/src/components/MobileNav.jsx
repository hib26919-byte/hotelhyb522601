import { BedDouble, CalendarDays, GalleryHorizontal, Home, Info, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { ROOM_CATEGORIES } from "../utils/siteData";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/rooms", label: "Rooms", icon: BedDouble },
  { to: "/gallery", label: "Gallery", icon: GalleryHorizontal },
  { to: "/about", label: "About", icon: Info },
  { to: "/profile", label: "Profile", icon: User },
];

const MobileNav = () => {
  const { openBooking } = useBooking();

  return (
    <div className="mobile-nav">
      <button
        type="button"
        className="mobile-nav__fab"
        onClick={() => openBooking(ROOM_CATEGORIES[1])}
        aria-label="Book a room"
      >
        <CalendarDays size={22} />
      </button>
      <nav className="mobile-nav__bar" aria-label="Mobile primary">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `mobile-nav__item ${isActive ? "active" : ""}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default MobileNav;

