import { useState } from "react";

import {
  Award, Building, HeartHandshake, Trophy, Star,
  Wifi, UtensilsCrossed, Car, ShieldCheck, Clock,
  MapPin, Users, BedDouble, Sparkles, ChevronRight,
  Quote, ThumbsUp, ExternalLink
} from "lucide-react";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { usePageHero } from "../hooks/usePageHero";
import PageHero from "../components/PageHero";
import SEOHead from "../components/SEOHead";
import SectionHeading from "../components/SectionHeading";
import { ATTRACTIONS, FOUNDERS, HOTEL_INFO } from "../utils/siteData";

/* ─── Static Google-style reviews ─── */
const GOOGLE_REVIEWS = [
  {
    id: 1,
    name: "Rahul Mehta",
    avatar: "RM",
    rating: 5,
    date: "2 weeks ago",
    text: "Exceptional stay at Bael Tree Hotels! The Executive Room was beautifully appointed with premium amenities. The Soul Curry restaurant had incredible biryani. Location is perfect for Hitec City business visits. Will definitely return.",
    helpful: 24,
    verified: true,
  },
  {
    id: 2,
    name: "Priya Venkatesh",
    avatar: "PV",
    rating: 5,
    date: "1 month ago",
    text: "Stayed in the Suite Room for our anniversary — absolutely stunning. The gold-accented interiors, cloud bed, and impeccable room service made it a night to remember. Staff was courteous and professional. Highly recommend!",
    helpful: 31,
    verified: true,
  },
  {
    id: 3,
    name: "Mohammed Farhan",
    avatar: "MF",
    rating: 4,
    date: "3 weeks ago",
    text: "Great hotel near HITEX. Clean rooms, fast Wi-Fi, excellent buffet breakfast. The Kadali Patra restaurant has authentic South Indian vegetarian food. Only minor thing — parking could be larger. Overall a fantastic experience.",
    helpful: 18,
    verified: true,
  },
  {
    id: 4,
    name: "Ananya Krishnamurthy",
    avatar: "AK",
    rating: 5,
    date: "2 months ago",
    text: "Bael Tree Hotels sets the standard for boutique luxury in Madhapur. The attention to detail — from the welcome drink to the turndown service — feels genuinely thoughtful. The heritage-modern design is stunning in person.",
    helpful: 42,
    verified: true,
  },
  {
    id: 5,
    name: "Vikram Reddy",
    avatar: "VR",
    rating: 5,
    date: "1 month ago",
    text: "Stayed here for a week during a project at Microsoft campus nearby. The work desk in the Executive Room is perfect for long work sessions. Complimentary breakfast was lavish. Front desk team goes above and beyond.",
    helpful: 27,
    verified: true,
  },
  {
    id: 6,
    name: "Sunita Agarwal",
    avatar: "SA",
    rating: 4,
    date: "3 months ago",
    text: "Lovely property with a warm, heritage-inspired aesthetic. The pool area (visible from the lobby) adds a resort feel. Premium room was spacious and immaculate. A bit pricey but absolutely worth the experience.",
    helpful: 15,
    verified: true,
  },
];

/* ─── Services list ─── */
const SERVICES = [
  {
    icon: BedDouble,
    title: "Luxury Accommodation",
    desc: "Four meticulously designed room categories — Standard, Executive, Premium, and Suite — each crafted to deliver comfort, privacy, and premium hospitality for solo and dual occupancy.",
    highlight: "85 Rooms across 4 categories",
  },
  {
    icon: UtensilsCrossed,
    title: "Signature Dining",
    desc: "Two distinct dining experiences under one roof: Kadali Patra for authentic Satvic vegetarian cuisine and The Soul Curry for bold gourmet non-vegetarian fare celebrating India's rich culinary heritage.",
    highlight: "Kadali Patra · The Soul Curry",
  },
  {
    icon: Car,
    title: "Airport & City Transfers",
    desc: "Seamless private chauffeur service from Rajiv Gandhi International Airport (35 km) and Secunderabad Railway Station (15 km), with competitive in-city rates available 24/7.",
    highlight: "Available 24 hours · 7 days",
  },
  {
    icon: Wifi,
    title: "Business-Ready Infrastructure",
    desc: "High-speed complimentary Wi-Fi throughout the property, work desks in every room, in-room safe, and proximity to Hitec City (2 km) and the Financial District (6 km).",
    highlight: "Hitec City · 2 km away",
  },
  {
    icon: ShieldCheck,
    title: "Premium Concierge",
    desc: "Our 24/7 front desk and dedicated concierge team manages everything from travel desk bookings and local recommendations to personalized in-room requests and event arrangements.",
    highlight: "24/7 Front Desk",
  },
  {
    icon: Sparkles,
    title: "Events & Celebrations",
    desc: "An intimate, sophisticated setting for corporate gatherings, private celebrations, and curated group events — paired with bespoke menus and attentive event coordination.",
    highlight: "Customized to every occasion",
  },
];

/* ─── Star rating display ─── */
const Stars = ({ rating, size = 14 }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        size={size}
        fill={s <= rating ? "#c9a84c" : "none"}
        color={s <= rating ? "#c9a84c" : "#ddd"}
      />
    ))}
  </div>
);

/* ─── Google Review Card ─── */
const ReviewCard = ({ review }) => {
  const [liked, setLiked] = useState(false);

  return (
    <article style={{
      background: "linear-gradient(180deg, #fff 0%, #fffdf9 100%)",
      border: "1px solid rgba(201,168,76,0.25)",
      borderRadius: 24,
      padding: "1.5rem",
      display: "grid",
      gap: "1rem",
      boxShadow: "0 8px 30px rgba(0,0,0,0.07)",
      transition: "all 0.35s ease",
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 20px 50px rgba(123,26,26,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.07)";
      }}
    >
      {/* Gold accent top line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 3,
        background: "linear-gradient(90deg, #c9a84c, #7b1a1a)",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #7b1a1a, #c9a84c)",
          color: "#fff", display: "grid", placeItems: "center",
          fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: "0.85rem",
        }}>
          {review.avatar}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem" }}>
              {review.name}
            </strong>
            {review.verified && (
              <span style={{
                fontSize: "0.65rem", color: "#1a73e8", fontWeight: 600,
                background: "rgba(26,115,232,0.08)", padding: "2px 6px", borderRadius: 99,
              }}>✓ Verified</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
            <Stars rating={review.rating} size={13} />
            <span style={{ fontSize: "0.75rem", color: "#8f8579" }}>{review.date}</span>
          </div>
        </div>
        {/* Google G */}
        <svg viewBox="0 0 24 24" width="22" height="22" style={{ flexShrink: 0 }}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      </div>

      {/* Quote */}
      <div style={{ position: "relative" }}>
        <Quote size={18} color="rgba(201,168,76,0.3)" style={{ marginBottom: 4 }} />
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.02rem", lineHeight: 1.75,
          color: "rgba(26,26,26,0.82)",
        }}>
          {review.text}
        </p>
      </div>

      {/* Helpful */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() => setLiked(l => !l)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0.35rem 0.75rem", borderRadius: 99,
            border: `1px solid ${liked ? "rgba(123,26,26,0.4)" : "rgba(0,0,0,0.12)"}`,
            background: liked ? "rgba(123,26,26,0.06)" : "transparent",
            color: liked ? "#7b1a1a" : "#5a5a5a",
            fontSize: "0.78rem", cursor: "pointer", transition: "all 0.2s",
          }}
        >
          <ThumbsUp size={13} fill={liked ? "#7b1a1a" : "none"} />
          Helpful · {liked ? review.helpful + 1 : review.helpful}
        </button>
      </div>
    </article>
  );
};

/* ─── Overall Rating Summary ─── */
const RatingSummary = () => {
  const breakdown = [
    { stars: 5, count: 128, pct: 82 },
    { stars: 4, count: 21, pct: 13 },
    { stars: 3, count: 6, pct: 4 },
    { stars: 2, count: 1, pct: 0.5 },
    { stars: 1, count: 0, pct: 0 },
  ];

  return (
    <div style={{
      background: "linear-gradient(180deg, #1a1a1a 0%, #2c1a1a 100%)",
      borderRadius: 28, padding: "2rem",
      color: "#faf8f5", display: "grid", gap: "1.5rem",
      border: "1px solid rgba(201,168,76,0.2)",
    }}>
      {/* Score */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "4.5rem", lineHeight: 1,
            background: "linear-gradient(135deg, #c9a84c, #e8d5a3)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>4.8</div>
          <Stars rating={5} size={16} />
          <div style={{ fontSize: "0.75rem", color: "rgba(250,248,245,0.55)", marginTop: 4 }}>
            156 reviews
          </div>
        </div>
        <div style={{ flex: 1, display: "grid", gap: "0.5rem" }}>
          {breakdown.map(row => (
            <div key={row.stars} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "0.75rem", color: "rgba(250,248,245,0.6)", width: 8 }}>{row.stars}</span>
              <Star size={11} fill="#c9a84c" color="#c9a84c" />
              <div style={{ flex: 1, height: 6, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${row.pct}%`, borderRadius: 99,
                  background: "linear-gradient(90deg, #c9a84c, #e8d5a3)",
                  transition: "width 1s ease",
                }} />
              </div>
              <span style={{ fontSize: "0.72rem", color: "rgba(250,248,245,0.5)", width: 20 }}>{row.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category scores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {[
          { label: "Cleanliness", score: "4.9" },
          { label: "Location", score: "4.8" },
          { label: "Service", score: "4.9" },
          { label: "Value", score: "4.7" },
        ].map(({ label, score }) => (
          <div key={label} style={{
            padding: "0.75rem 1rem", borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(201,168,76,0.12)",
          }}>
            <div style={{
              fontFamily: "'Playfair Display', serif", fontSize: "1.5rem",
              color: "#c9a84c",
            }}>{score}</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(250,248,245,0.55)" }}>{label}</div>
          </div>
        ))}
      </div>

      <a
        href="https://g.page/r/baeltreehotels/review"
        target="_blank"
        rel="noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "0.85rem", borderRadius: 99,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(201,168,76,0.25)",
          color: "#c9a84c", fontSize: "0.85rem", fontWeight: 600,
          textDecoration: "none", transition: "all 0.3s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.12)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
      >
        <ExternalLink size={15} />
        Write a Google Review
      </a>
    </div>
  );
};

/* ─── About Page ─── */
const About = () => {
  const { data: founders } = useFirestoreCollection("founders", {
    fallbackData: FOUNDERS,
  });

 const { heroImage: fetchedHero } = usePageHero("about");
const heroImage = fetchedHero ||
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1800&q=80";
  return (
    <>
      <SEOHead
        title="About Bael Tree Hotels | Luxury Hotel in Madhapur, Hyderabad — Heritage Hospitality"
        description="Bael Tree Hotels in Madhapur, Hyderabad offers heritage-inspired luxury accommodation, signature dining at Kadali Patra and The Soul Curry, and premium business & leisure services near Hitec City, HITEX, and the Financial District."
        path="/about"
        keywords="luxury hotel madhapur hyderabad, bael tree hotels, hotel near hitec city, premium hotel hyderabad, boutique hotel madhapur, business hotel hyderabad, hotel near financial district hyderabad, best hotel madhapur, kadali patra restaurant, soul curry restaurant"
      />

      <PageHero
  eyebrow="About Bael Tree Hotels"
  title="A sanctuary shaped for today's Hyderabad"
  description="Heritage warmth, refined design, and world-class hospitality converging at the heart of Madhapur — India's premier tech and business corridor."
  image={heroImage}
/>

      {/* ── Story section ── */}
      <section className="section">
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "3rem", alignItems: "center",
        }} className="about-story-grid">
          <div className="reveal">
            <span className="eyebrow">Our Story</span>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              lineHeight: 1.1, margin: "0.8rem 0 1.2rem",
            }}>
              Where heritage hospitality meets contemporary grandeur
            </h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.15rem", lineHeight: 1.8, color: "rgba(26,26,26,0.75)",
              marginBottom: "1rem",
            }}>
              Nestled in the vibrant heart of Madhapur — Hyderabad's premier technology and business hub — Bael Tree Hotels stands as a beacon of tranquility amidst the urban pulse. We invite you to experience an abode where the timeless ethos of Indian hospitality is woven into modern luxury.
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.15rem", lineHeight: 1.8, color: "rgba(26,26,26,0.75)",
            }}>
              Every detail at Bael Tree — from our heirloom-quality décor and chef-special menus to our 24/7 concierge and premium in-room finishes — is a tribute to the art of fine living. Our philosophy is simple: a stay that is not merely comfortable, but truly soulful.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="reveal">
            {[
              { label: "85", sub: "Curated Rooms" },
              { label: "2", sub: "Signature Restaurants" },
              { label: "4", sub: "Room Categories" },
              { label: "24/7", sub: "Guest Support" },
            ].map(({ label, sub }) => (
              <div key={sub} style={{
                padding: "1.75rem 1.25rem", borderRadius: 24, textAlign: "center",
                background: "linear-gradient(145deg, rgba(26,26,26,0.95), rgba(123,26,26,0.88))",
                color: "#faf8f5",
                border: "1px solid rgba(201,168,76,0.2)",
              }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontSize: "2.8rem",
                  background: "linear-gradient(135deg, #c9a84c, #e8d5a3)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>{label}</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(250,248,245,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services section ── */}
      <section className="section" style={{ background: "linear-gradient(180deg, #f7f2e8 0%, #faf8f5 100%)", width: "100%", maxWidth: "100%" }}>
        <div style={{ width: "var(--container)", margin: "0 auto", padding: "5.5rem 0" }}>
          <SectionHeading
            eyebrow="What We Offer"
            title="A full spectrum of luxury services"
            description="From seamless arrivals to signature dining, every service at Bael Tree Hotels is designed to surpass expectations for both business and leisure travellers."
            centered
          />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.25rem",
          }} className="services-grid">
            {SERVICES.map(({ icon: Icon, title, desc, highlight }) => (
              <article key={title} className="reveal" style={{
                padding: "1.75rem",
                borderRadius: 26,
                background: "#fff",
                border: "1px solid rgba(201,168,76,0.2)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
                display: "grid", gap: "0.85rem",
                transition: "all 0.35s ease",
                position: "relative", overflow: "hidden",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 24px 60px rgba(123,26,26,0.14)";
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.45)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.06)";
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)";
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 18,
                  background: "linear-gradient(135deg, rgba(26,26,26,0.94), rgba(123,26,26,0.88))",
                  display: "grid", placeItems: "center",
                }}>
                  <Icon size={22} color="#c9a84c" />
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem" }}>{title}</h3>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", lineHeight: 1.7, color: "rgba(26,26,26,0.72)" }}>{desc}</p>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "0.35rem 0.8rem", borderRadius: 99,
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  color: "#7b1a1a", fontSize: "0.75rem", fontWeight: 600,
                  letterSpacing: "0.05em",
                }}>
                  <Sparkles size={12} />
                  {highlight}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="section">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="mission-grid-2col">
          {[
            { icon: HeartHandshake, label: "Mission", text: "To offer a luxury stay experience in Madhapur that pairs precision, warmth, and cultural texture for business and leisure guests alike — making every visit feel personal, purposeful, and profoundly comfortable." },
            { icon: Award, label: "Vision", text: "To become Hyderabad's most trusted premium hotel address by championing hospitality that is quietly efficient, visually memorable, and rooted in the warmth of Indian tradition." },
          ].map(({ icon: Icon, label, text }) => (
            <article key={label} className="reveal" style={{
              padding: "2rem", borderRadius: 28,
              background: "linear-gradient(145deg, rgba(26,26,26,0.95), rgba(44,26,26,0.92))",
              color: "#faf8f5", display: "grid", gap: "1rem",
              border: "1px solid rgba(201,168,76,0.18)",
            }}>
              <Icon size={28} color="#c9a84c" />
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem" }}>{label}</h3>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", lineHeight: 1.8, color: "rgba(250,248,245,0.78)" }}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Founders ── */}
      <section className="section">
        <SectionHeading
          eyebrow="Leadership"
          title="The minds behind the vision"
          description="A founding team aligned around thoughtful service design, warm guest journeys, and a deeply rooted belief that luxury should feel personal — not transactional."
          centered
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
        }} className="founders-grid-3col">
          {founders.map(founder => (
            <article key={founder.id} className="reveal" style={{
              borderRadius: 28, overflow: "hidden",
              border: "1px solid rgba(201,168,76,0.22)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
              background: "#fff",
              transition: "all 0.35s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = "0 28px 70px rgba(123,26,26,0.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08)"; }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={founder.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80"}
                  alt={founder.name}
                  loading="lazy"
                  style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover" }}
                />
                <div style={{
                  position: "absolute", inset: "auto 0 0",
                  padding: "2rem 1.5rem 1.25rem",
                  background: "linear-gradient(0deg, rgba(26,26,26,0.92) 0%, transparent 100%)",
                  color: "#faf8f5",
                }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem" }}>{founder.name}</h3>
                  <span style={{ color: "#c9a84c", fontSize: "0.82rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em" }}>{founder.role}</span>
                </div>
              </div>
              <div style={{ padding: "1.25rem 1.5rem" }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", lineHeight: 1.75, color: "rgba(26,26,26,0.75)" }}>{founder.bio}</p>
                {founder.linkedin && (
                  <a href={founder.linkedin} target="_blank" rel="noreferrer" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    marginTop: "0.75rem", color: "#0a66c2", fontSize: "0.82rem", fontWeight: 600,
                    textDecoration: "none",
                  }}>
                    <ExternalLink size={13} /> LinkedIn Profile
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Google Reviews section ── */}
      <section className="section" style={{ background: "linear-gradient(180deg, #faf8f5 0%, #f7f2e8 100%)", width: "100%", maxWidth: "100%" }}>
        <div style={{ width: "var(--container)", margin: "0 auto", padding: "5.5rem 0" }}>
          <SectionHeading
            eyebrow="Google Reviews"
            title="What our guests say"
            description="Real experiences from verified guests who stayed at Bael Tree Hotels — rated 4.8 out of 5 across 156 Google reviews."
            centered
          />
          <div style={{
            display: "grid", gridTemplateColumns: "300px 1fr",
            gap: "2rem", alignItems: "start",
          }} className="reviews-layout-grid">
            {/* Rating summary */}
            <div className="reveal">
              <RatingSummary />
            </div>

            {/* Review cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="reviews-cards-grid">
              {GOOGLE_REVIEWS.map(review => (
                <div key={review.id} className="reveal stagger-item">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Location & Attractions ── */}
      <section className="section">
        <SectionHeading
          eyebrow="Location"
          title="Anchored in Madhapur"
          description="Our address in Madhapur puts guests within minutes of Hyderabad's major business hubs, convention centres, and cultural landmarks."
          centered
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }} className="location-grid">
          <iframe
            src="https://www.google.com/maps?q=Ground+Floor,Plot+No.529,100+Feet+Road,Madhapur,Hyderabad&output=embed"
            title="Bael Tree Hotels location map"
            style={{ width: "100%", minHeight: 400, border: 0, borderRadius: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
            loading="lazy"
          />
          <div style={{ display: "grid", gap: "0.85rem", alignContent: "start" }}>
            {[
              { icon: "✈️", label: "Rajiv Gandhi Airport", dist: "35 km · ~45 min" },
              { icon: "🚂", label: "Secunderabad Railway", dist: "15 km · ~25 min" },
              { icon: "🏢", label: "Hitec City", dist: "2 km · 5 min" },
              { icon: "🏛️", label: "Hitex Exhibition Centre", dist: "2.5 km · 6 min" },
              { icon: "💼", label: "Financial District", dist: "6 km · 12 min" },
              { icon: "💻", label: "Microsoft · Deloitte · Wipro", dist: "Within 6 km" },
            ].map(({ icon, label, dist }) => (
              <div key={label} className="reveal" style={{
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "1rem 1.25rem", borderRadius: 18,
                background: "linear-gradient(180deg, #fff 0%, #fffdf9 100%)",
                border: "1px solid rgba(201,168,76,0.2)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              }}>
                <span style={{ fontSize: "1.4rem" }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>{label}</div>
                  <div style={{ fontSize: "0.78rem", color: "#8f8579" }}>{dist}</div>
                </div>
                <ChevronRight size={16} color="#c9a84c" style={{ marginLeft: "auto" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .about-story-grid,
          .services-grid,
          .founders-grid-3col,
          .mission-grid-2col,
          .location-grid { grid-template-columns: 1fr !important; }
          .reviews-layout-grid { grid-template-columns: 1fr !important; }
          .reviews-cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
};

export default About;