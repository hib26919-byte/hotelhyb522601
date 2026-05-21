import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { HOTEL_INFO, ROOM_CATEGORIES } from "../utils/siteData";

const Footer = () => (
  <footer className="footer">
    <div className="divider-gold" aria-hidden="true" />
    <div className="footer__grid">
      <div>
       <div className="navbar__brand footer__brand">
  <img 
    src="/logo.webp" 
    alt="Bael Tree Hotels" 
    style={{ width: 52, height: 52, borderRadius: 18, objectFit: "contain" }}
  />
  <div>
    <strong>Bael Tree Hotels</strong>
    <small>{HOTEL_INFO.tagline}</small>
  </div>
</div>
        <p>
          Heritage warmth, city convenience, and refined hospitality shaped for
          Hyderabad's business and leisure travellers.
        </p>
        <div className="footer__socials">
          {[Facebook, Instagram, Linkedin].map((Icon, index) => (
            <Link key={index} to="/" aria-label="Social channel">
              <Icon size={16} />
            </Link>
          ))}
        </div>
      </div>
      <div>
        <h4>Quick Links</h4>
        <nav className="footer__links">
          {["/", "/rooms", "/dining", "/gallery", "/about", "/contact"].map((path) => (
            <NavLink key={path} to={path}>
              {path === "/" ? "Home" : path.replace("/", "").replace(/^\w/, (char) => char.toUpperCase())}
            </NavLink>
          ))}
        </nav>
      </div>
      <div>
        <h4>Room Types</h4>
        <nav className="footer__links">
          {ROOM_CATEGORIES.map((room) => (
            <NavLink key={room.id} to={`/rooms?room=${room.category}`}>
              {room.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div>
        <h4>Contact</h4>
        <div className="footer__contact">
          <p>
            <MapPin size={16} />
            <span>{HOTEL_INFO.address}</span>
          </p>
          <p>
            <Phone size={16} />
            <span>{HOTEL_INFO.phone}</span>
          </p>
          <p>
            <Mail size={16} />
            <span>{HOTEL_INFO.email}</span>
          </p>
        </div>
      </div>
    </div>
    <div className="footer__bottom">
      <p>© {new Date().getFullYear()} Bael Tree Hotels. All rights reserved.</p>
      <div>
        <span>Privacy Policy</span>
        <span>Terms & Conditions</span>
      </div>
      <p>Designed with care for Bael Tree Hotels</p>
    </div>
  </footer>
);

export default Footer;

