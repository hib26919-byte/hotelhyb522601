import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { usePageHero } from "../hooks/usePageHero";
import { Mail, MapPin, Phone, Send, Star, Quote, ThumbsUp, ExternalLink, Clock, Shield, Award, CheckCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import PageHero from "../components/PageHero";
import SEOHead from "../components/SEOHead";
import { db } from "../utils/firebase";
import { HOTEL_INFO } from "../utils/siteData";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  checkInDate: "",
  checkOutDate: "",
  roomType: "",
  guests: "",
  message: "",
};

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
    tag: "Business Stay",
  },
  {
    id: 2,
    name: "Priya Venkatesh",
    avatar: "PV",
    rating: 5,
    date: "1 month ago",
    text: "Stayed in the Suite Room for our anniversary — absolutely stunning. The gold-accented interiors and cloud-soft bedding made it a night to remember. Staff was courteous and professional. Highly recommend for special occasions!",
    helpful: 31,
    verified: true,
    tag: "Anniversary",
  },
  {
    id: 3,
    name: "Mohammed Farhan",
    avatar: "MF",
    rating: 4,
    date: "3 weeks ago",
    text: "Great hotel near HITEX. Clean rooms, fast Wi-Fi, excellent buffet breakfast. The Kadali Patra restaurant has authentic South Indian vegetarian food. Overall a fantastic experience for the price point.",
    helpful: 18,
    verified: true,
    tag: "Leisure",
  },
  {
    id: 4,
    name: "Ananya Krishnamurthy",
    avatar: "AK",
    rating: 5,
    date: "2 months ago",
    text: "Bael Tree sets the standard for boutique luxury in Madhapur. The attention to detail — from the welcome drink to the turndown service — feels genuinely thoughtful. The heritage-modern design is stunning in person.",
    helpful: 42,
    verified: true,
    tag: "Luxury Stay",
  },
  {
    id: 5,
    name: "Vikram Reddy",
    avatar: "VR",
    rating: 5,
    date: "1 month ago",
    text: "Stayed here for a week during a Microsoft project nearby. The work desk in the Executive Room is perfect for long sessions. Complimentary breakfast was lavish. Front desk team goes above and beyond every time.",
    helpful: 27,
    verified: true,
    tag: "Work Trip",
  },
  {
    id: 6,
    name: "Sunita Agarwal",
    avatar: "SA",
    rating: 4,
    date: "3 months ago",
    text: "Lovely property with a warm, heritage-inspired aesthetic. Premium room was spacious and immaculate. A bit pricey but absolutely worth the experience. The pool area adds a resort feel to the entire stay.",
    helpful: 15,
    verified: true,
    tag: "Family Stay",
  },
];

const Stars = ({ rating, size = 13 }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={size}
        fill={s <= rating ? "#c9a84c" : "none"}
        color={s <= rating ? "#c9a84c" : "rgba(201,168,76,0.3)"}
      />
    ))}
  </div>
);

const ReviewCard = ({ review, index }) => {
  const [liked, setLiked] = useState(false);
  const tagColors = {
    "Business Stay": { bg: "rgba(26,115,232,0.1)", color: "#1a73e8" },
    "Anniversary":   { bg: "rgba(201,168,76,0.12)", color: "#7b5c00" },
    "Leisure":       { bg: "rgba(51,160,67,0.1)", color: "#1f7c2d" },
    "Luxury Stay":   { bg: "rgba(123,26,26,0.1)", color: "#7b1a1a" },
    "Work Trip":     { bg: "rgba(124,58,237,0.08)", color: "#5b21b6" },
    "Family Stay":   { bg: "rgba(245,158,11,0.1)", color: "#92400e" },
  };
  const tag = tagColors[review.tag] || { bg: "rgba(201,168,76,0.1)", color: "#7b1a1a" };

  return (
    <article
      style={{
        background: "#fff",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: 22,
        padding: "1.4rem",
        display: "grid",
        gap: "0.9rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        transition: "all 0.35s ease",
        position: "relative",
        overflow: "hidden",
        animationDelay: `${index * 80}ms`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 16px 44px rgba(123,26,26,0.12)";
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)";
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, #c9a84c, #7b1a1a, #c9a84c)",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #7b1a1a, #c9a84c)",
          color: "#fff", display: "grid", placeItems: "center",
          fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: "0.8rem",
        }}>{review.avatar}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <strong style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem" }}>
              {review.name}
            </strong>
            {review.verified && <CheckCircle size={13} color="#1a73e8" />}
            <span style={{
              fontSize: "0.65rem", padding: "2px 8px", borderRadius: 99,
              background: tag.bg, color: tag.color, fontWeight: 600, flexShrink: 0,
            }}>{review.tag}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <Stars rating={review.rating} />
            <span style={{ fontSize: "0.72rem", color: "#8f8579" }}>{review.date}</span>
          </div>
        </div>
        <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0, marginTop: 2 }}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      </div>

      <div style={{ position: "relative" }}>
        <Quote size={16} color="rgba(201,168,76,0.25)" style={{ marginBottom: 3 }} />
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "0.98rem", lineHeight: 1.7,
          color: "rgba(26,26,26,0.78)",
        }}>{review.text}</p>
      </div>

      <button
        type="button"
        onClick={() => setLiked((l) => !l)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "0.3rem 0.65rem", borderRadius: 99,
          border: `1px solid ${liked ? "rgba(123,26,26,0.35)" : "rgba(0,0,0,0.1)"}`,
          background: liked ? "rgba(123,26,26,0.06)" : "transparent",
          color: liked ? "#7b1a1a" : "#888",
          fontSize: "0.74rem", cursor: "pointer", transition: "all 0.2s",
          justifySelf: "start",
        }}
      >
        <ThumbsUp size={12} fill={liked ? "#7b1a1a" : "none"} />
        Helpful · {liked ? review.helpful + 1 : review.helpful}
      </button>
    </article>
  );
};

const RatingSummary = () => {
  const breakdown = [
    { stars: 5, count: 128, pct: 82 },
    { stars: 4, count: 21,  pct: 13 },
    { stars: 3, count: 6,   pct: 4  },
    { stars: 2, count: 1,   pct: 0.5 },
    { stars: 1, count: 0,   pct: 0  },
  ];

  return (
    <div style={{
      background: "linear-gradient(180deg, #1a1a1a 0%, #2c1a1a 100%)",
      borderRadius: 24, padding: "1.75rem",
      color: "#faf8f5",
      border: "1px solid rgba(201,168,76,0.2)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: "3.8rem", lineHeight: 1,
            background: "linear-gradient(135deg, #c9a84c, #e8d5a3)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>4.8</div>
          <Stars rating={5} size={14} />
          <div style={{ fontSize: "0.72rem", color: "rgba(250,248,245,0.5)", marginTop: 4 }}>
            156 reviews
          </div>
        </div>
        <div style={{ flex: 1, display: "grid", gap: "0.45rem" }}>
          {breakdown.map((row) => (
            <div key={row.stars} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.72rem", color: "rgba(250,248,245,0.55)", width: 8 }}>
                {row.stars}
              </span>
              <Star size={10} fill="#c9a84c" color="#c9a84c" />
              <div style={{
                flex: 1, height: 5, borderRadius: 99,
                background: "rgba(255,255,255,0.1)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${row.pct}%`, borderRadius: 99,
                  background: "linear-gradient(90deg, #c9a84c, #e8d5a3)",
                }} />
              </div>
              <span style={{
                fontSize: "0.68rem", color: "rgba(250,248,245,0.45)",
                width: 18, textAlign: "right",
              }}>{row.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1rem" }}>
        {[
          { label: "Cleanliness", score: "4.9" },
          { label: "Location",    score: "4.8" },
          { label: "Service",     score: "4.9" },
          { label: "Value",       score: "4.7" },
        ].map(({ label, score }) => (
          <div key={label} style={{
            padding: "0.65rem 0.85rem", borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(201,168,76,0.1)",
          }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.3rem", color: "#c9a84c",
            }}>{score}</div>
            <div style={{
              fontSize: "0.68rem", color: "rgba(250,248,245,0.5)",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ← THIS WAS THE BUG: <a was missing, only the attributes existed */}
      <a
        href="https://g.page/r/baeltreehotels/review"
        target="_blank"
        rel="noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "0.75rem", borderRadius: 99,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(201,168,76,0.22)",
          color: "#c9a84c", fontSize: "0.82rem", fontWeight: 600,
          textDecoration: "none", transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.12)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
      >
        <ExternalLink size={14} />
        Write a Google Review
      </a>
    </div>
  );
};

const SEOContentBlock = () => (
  <section style={{ background: "linear-gradient(180deg, #f7f2e8 0%, #faf8f5 100%)", width: "100%", maxWidth: "100%" }}>
    <div style={{ width: "var(--container)", margin: "0 auto", padding: "4rem 0" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", marginBottom: "3rem" }}
        className="seo-features-grid"
      >
        {[
          {
            icon: Award,
            title: "Best Luxury Hotel in Madhapur",
            text: "Bael Tree Hotels is Madhapur's premier boutique luxury hotel, offering world-class amenities, signature dining, and unmatched hospitality just 2 km from Hitec City.",
          },
          {
            icon: Shield,
            title: "Trusted by 10,000+ Guests",
            text: "From corporate travellers to anniversary getaways, our 4.8-star Google rating across 156 reviews speaks to consistent service excellence since our establishment.",
          },
          {
            icon: Clock,
            title: "24/7 Concierge Support",
            text: "Our round-the-clock front desk and dedicated concierge team ensures seamless arrivals, local recommendations, and personalized in-room service at any hour.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <article
            key={title}
            style={{
              padding: "1.5rem", borderRadius: 22, background: "#fff",
              border: "1px solid rgba(201,168,76,0.18)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              display: "grid", gap: "0.75rem", transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 16px 40px rgba(123,26,26,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.05)";
            }}
          >
            <div style={{
              width: 46, height: 46, borderRadius: 16,
              background: "linear-gradient(135deg, rgba(26,26,26,0.94), rgba(123,26,26,0.88))",
              display: "grid", placeItems: "center",
            }}>
              <Icon size={20} color="#c9a84c" />
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", lineHeight: 1.3 }}>
              {title}
            </h3>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1rem", lineHeight: 1.7, color: "rgba(26,26,26,0.7)",
            }}>{text}</p>
          </article>
        ))}
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}
        className="seo-text-grid"
      >
        <div>
          <span className="eyebrow">Luxury Hotel in Madhapur, Hyderabad</span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
            lineHeight: 1.2, margin: "0.75rem 0 1rem",
          }}>
            Your premium address near Hitec City & HITEX
          </h2>
          <div style={{ display: "grid", gap: "0.85rem" }}>
            {[
              "Bael Tree Hotels is conveniently located at Plot No.529, 100 Feet Road, Madhapur — Hyderabad's premier IT and business hub. Guests enjoy seamless access to Hitec City (2 km), the Financial District (6 km), and Rajiv Gandhi International Airport (35 km).",
              "Whether you're visiting for a corporate project, an industry conference at HITEX, or a leisure escape with family, our four curated room categories — Standard, Executive, Premium, and Suite — offer something for every traveller.",
              "Our signature restaurants, Kadali Patra (authentic Satvic vegetarian) and The Soul Curry (gourmet non-vegetarian), have been celebrated by guests as standout dining destinations in Madhapur.",
            ].map((para, i) => (
              <p key={i} style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.05rem", lineHeight: 1.8, color: "rgba(26,26,26,0.75)",
              }}>{para}</p>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", marginBottom: "0.25rem" }}>
            Frequently Asked Questions
          </h3>
          {[
            {
              q: "What is the check-in and check-out time at Bael Tree Hotels?",
              a: "Standard check-in is at 2:00 PM and check-out is at 11:00 AM. Early check-in and late check-out are available on request, subject to room availability.",
            },
            {
              q: "Is Bael Tree Hotels close to Hyderabad airport?",
              a: "Yes. Rajiv Gandhi International Airport is approximately 35 km away (around 45 minutes by road). We offer private airport transfer services 24/7.",
            },
            {
              q: "Does Bael Tree Hotels have a restaurant?",
              a: "We have two signature restaurants: Kadali Patra, serving Satvic vegetarian cuisine, and The Soul Curry, offering gourmet non-vegetarian dishes. Both are open for breakfast, lunch, and dinner.",
            },
            {
              q: "Is parking available at the hotel?",
              a: "Yes, Bael Tree Hotels provides complimentary parking for in-house guests. Valet parking is also available on request.",
            },
          ].map(({ q, a }, i) => (
            <div key={i} style={{
              padding: "1rem 1.15rem", borderRadius: 16,
              background: "#fff", border: "1px solid rgba(201,168,76,0.15)",
            }}>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.35rem", color: "#1a1a1a" }}>
                Q: {q}
              </div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "0.98rem", lineHeight: 1.65, color: "rgba(26,26,26,0.72)",
              }}>A: {a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const Contact = () => {
  const { heroImage: fetchedHero } = usePageHero("contact");
  const heroImage =
    fetchedHero ||
    "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1800&q=80";

  const [formValues, setFormValues] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "inquiries"), {
        ...formValues,
        type: activeTab,
        createdAt: serverTimestamp(),
      });
      toast.success("Inquiry sent successfully. Our team will reach out soon.");
      setFormValues(initialForm);
    } catch (error) {
      toast.error(error.message || "Unable to send inquiry right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Contact Bael Tree Hotels | Luxury Hotel Madhapur Hyderabad | Reservations & Inquiries"
        description="Contact Bael Tree Hotels in Madhapur, Hyderabad for room reservations, dining inquiries, event bookings, and travel planning. Located 2km from Hitec City. Call +91-9642325555 or email us. 4.8★ rated luxury hotel."
        path="/contact"
        keywords="contact bael tree hotels, luxury hotel madhapur contact, hotel near hitec city hyderabad, hotel reservations madhapur, bael tree hotels phone number, best hotel madhapur hyderabad, hotel near financial district hyderabad"
      />

      <PageHero
        eyebrow="Contact Us"
        title="Let us craft your perfect stay"
        description="Reach our concierge team for reservations, event planning, airport transfers, and personalized stay experiences in Hyderabad's premier tech corridor."
        image={heroImage}
      />

      <section className="section">
        <div
          style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: "2rem", alignItems: "start" }}
          className="contact-main-grid"
        >
          <div style={{ display: "grid", gap: "1.25rem" }}>
            <div style={{
              borderRadius: 28,
              background: "linear-gradient(180deg, #1a1a1a 0%, #2c1a1a 100%)",
              color: "#faf8f5", padding: "2rem",
              border: "1px solid rgba(201,168,76,0.2)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}>
              <div className="eyebrow" style={{ color: "#c9a84c", marginBottom: "1rem" }}>
                Reach Us Directly
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)", marginBottom: "1.5rem",
              }}>
                We're here 24 hours a day
              </h2>
              <div style={{ display: "grid", gap: "1rem" }}>
                {[
                  { icon: MapPin, label: "Address",      value: HOTEL_INFO.address,      href: null },
                  { icon: Phone,  label: "Front Desk",   value: HOTEL_INFO.phone,         href: `tel:${HOTEL_INFO.phone}` },
                  { icon: Mail,   label: "Email",        value: HOTEL_INFO.email,         href: `mailto:${HOTEL_INFO.email}` },
                  { icon: Send,   label: "Reservations", value: HOTEL_INFO.reservations,  href: `mailto:${HOTEL_INFO.reservations}` },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex", gap: "0.9rem", alignItems: "flex-start",
                      padding: "0.85rem 1rem", borderRadius: 16,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(201,168,76,0.1)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(201,168,76,0.07)";
                      e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(201,168,76,0.1)";
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                      background: "rgba(201,168,76,0.15)",
                      display: "grid", placeItems: "center",
                    }}>
                      <Icon size={16} color="#c9a84c" />
                    </div>
                    <div>
                      <div style={{
                        fontSize: "0.72rem", color: "rgba(250,248,245,0.5)",
                        textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3,
                      }}>{label}</div>
                      {href ? (
                        <a href={href} style={{
                          color: "#faf8f5", textDecoration: "none",
                          fontSize: "0.9rem", fontFamily: "'Lato', sans-serif",
                        }}>{value}</a>
                      ) : (
                        <span style={{ color: "rgba(250,248,245,0.88)", fontSize: "0.88rem", lineHeight: 1.5 }}>
                          {value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              borderRadius: 22, background: "#fff",
              border: "1px solid rgba(201,168,76,0.18)",
              padding: "1.25rem", boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            }}>
              <div style={{
                fontFamily: "'Cinzel', serif", fontSize: "0.72rem",
                letterSpacing: "0.14em", color: "#7b1a1a",
                textTransform: "uppercase", marginBottom: "0.85rem",
              }}>Quick Facts</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                {[
                  { label: "Check-in",    value: "2:00 PM" },
                  { label: "Check-out",   value: "11:00 AM" },
                  { label: "Airport",     value: "35 km · 45 min" },
                  { label: "Hitec City",  value: "2 km · 5 min" },
                  { label: "Restaurants", value: "2 Signature" },
                  { label: "Room Types",  value: "4 Categories" },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    padding: "0.65rem 0.85rem", borderRadius: 12,
                    background: "rgba(201,168,76,0.05)",
                    border: "1px solid rgba(201,168,76,0.12)",
                  }}>
                    <div style={{
                      fontSize: "0.68rem", color: "#8f8579",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1a1a1a", marginTop: 2 }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            borderRadius: 28, background: "#fff",
            border: "1px solid rgba(201,168,76,0.2)",
            padding: "2rem", boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
          }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)", marginBottom: "0.5rem",
            }}>Send an Inquiry</h2>
            <p style={{
              color: "#8f8579", marginBottom: "1.25rem",
              fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem",
            }}>
              Our team typically responds within 2 business hours.
            </p>

            <div style={{
              display: "flex", gap: "0.5rem", marginBottom: "1.25rem",
              padding: "0.3rem", background: "rgba(201,168,76,0.08)",
              borderRadius: 14, width: "fit-content",
            }}>
              {[
                { id: "general",     label: "General" },
                { id: "reservation", label: "Reservation" },
                { id: "event",       label: "Event" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  style={{
                    padding: "0.55rem 1rem", borderRadius: 10,
                    background: activeTab === id ? "#1a1a1a" : "transparent",
                    color: activeTab === id ? "#faf8f5" : "#8f8579",
                    fontFamily: "'Cinzel', serif", fontSize: "0.72rem",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    border: "none", cursor: "pointer", transition: "all 0.25s ease",
                  }}
                >{label}</button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field-grid">
                <label>
                  Name *
                  <input
                    type="text"
                    value={formValues.name}
                    onChange={(e) => setFormValues((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                </label>
                <label>
                  Email *
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(e) => setFormValues((p) => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </label>
                <label>
                  Phone
                  <input
                    type="tel"
                    value={formValues.phone}
                    onChange={(e) => setFormValues((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </label>
                {activeTab !== "general" && (
                  <label>
                    Room Type
                    <select
                      value={formValues.roomType}
                      onChange={(e) => setFormValues((p) => ({ ...p, roomType: e.target.value }))}
                    >
                      <option value="">Select room type</option>
                      <option value="standard">Standard Room</option>
                      <option value="executive">Executive Room</option>
                      <option value="premium">Premium Room</option>
                      <option value="suite">Suite Room</option>
                    </select>
                  </label>
                )}
                {activeTab === "reservation" && (
                  <>
                    <label>
                      Check-in Date
                      <input
                        type="date"
                        value={formValues.checkInDate}
                        onChange={(e) => setFormValues((p) => ({ ...p, checkInDate: e.target.value }))}
                      />
                    </label>
                    <label>
                      Check-out Date
                      <input
                        type="date"
                        value={formValues.checkOutDate}
                        onChange={(e) => setFormValues((p) => ({ ...p, checkOutDate: e.target.value }))}
                      />
                    </label>
                    <label>
                      Number of Guests
                      <select
                        value={formValues.guests}
                        onChange={(e) => setFormValues((p) => ({ ...p, guests: e.target.value }))}
                      >
                        <option value="">Select</option>
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>{n} Guest{n > 1 ? "s" : ""}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                <label className="field-grid__full">
                  Message
                  <textarea
                    rows="4"
                    value={formValues.message}
                    onChange={(e) => setFormValues((p) => ({ ...p, message: e.target.value }))}
                    placeholder={
                      activeTab === "event"
                        ? "Tell us about your event — date, number of attendees, occasion type..."
                        : activeTab === "reservation"
                        ? "Any special requests, preferences, or questions about your stay..."
                        : "How can our team assist you today?"
                    }
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%", padding: "1rem", marginTop: "0.25rem",
                  borderRadius: 999, border: "none",
                  background: "linear-gradient(135deg, #e8d5a3, #c9a84c)",
                  color: "#1a1a1a", fontWeight: 700, fontSize: "0.95rem",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: "0 10px 24px rgba(201,168,76,0.3)",
                  transition: "all 0.3s ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 16px 36px rgba(201,168,76,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 10px 24px rgba(201,168,76,0.3)";
                }}
              >
                <Send size={16} />
                {submitting ? "Sending..." : "Send Inquiry"}
              </button>

              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                justifyContent: "center", marginTop: "0.75rem",
                fontSize: "0.78rem", color: "#8f8579",
              }}>
                <Shield size={12} color="#73d98f" />
                Your information is secure and will never be shared
              </div>
            </form>
          </div>
        </div>
      </section>

      <SEOContentBlock />

      <section className="section">
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <span className="eyebrow">Google Reviews</span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            lineHeight: 1.1, margin: "0.75rem 0 0.5rem",
          }}>What our guests are saying</h2>
          <p style={{ color: "rgba(26,26,26,0.65)", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>
            Verified reviews from guests who stayed at Bael Tree Hotels — rated 4.8 out of 5 across 156 Google reviews.
          </p>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.75rem", alignItems: "start" }}
          className="reviews-layout"
        >
          <div className="reveal">
            <RatingSummary />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}
            className="reviews-cards"
          >
            {GOOGLE_REVIEWS.map((review, i) => (
              <div key={review.id} className="reveal stagger-item">
                <ReviewCard review={review} index={i} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div style={{
          borderRadius: 28, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          border: "1px solid rgba(201,168,76,0.18)",
        }}>
          <iframe
            src={HOTEL_INFO.coordinatesEmbed || "https://www.google.com/maps?q=Ground+Floor,Plot+No.529,100+Feet+Road,Madhapur,Hyderabad&output=embed"}
            title="Bael Tree Hotels location"
            style={{ width: "100%", minHeight: 400, border: 0, display: "block" }}
            loading="lazy"
          />
        </div>
      </section>

      <style>{`
        @media (max-width: 1024px) {
          .contact-main-grid { grid-template-columns: 1fr !important; }
          .reviews-layout { grid-template-columns: 1fr !important; }
          .reviews-cards { grid-template-columns: 1fr !important; }
          .seo-features-grid { grid-template-columns: 1fr !important; }
          .seo-text-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .reviews-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
};

export default Contact;