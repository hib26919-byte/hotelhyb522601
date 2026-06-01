import { ArrowRight, Building2, MapPinned, Plane, TrainFront, TramFront, Star, Shield, Clock, Award, Quote, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { useAllRoomsAvailabilityToday } from "../hooks/useRoomAvailability";
import DiningSection from "../components/DiningSection";
import GoogleReviewsSection from "../components/GoogleReviewsSection";
import HeroSlider from "../components/HeroSlider";
import RoomCard from "../components/RoomCard";
import SectionHeading from "../components/SectionHeading";
import SEOHead from "../components/SEOHead";
import TestimonialsSection from "../components/TestimonialsSection";
import VideoShowcase from "../components/VideoShowcase";
import {
  ATTRACTIONS,
  HOTEL_INFO,
  ROOM_CATEGORIES,
} from "../utils/siteData";

const reachItems = [
  { icon: Plane, label: "Airport", detail: HOTEL_INFO.transit.airport },
  { icon: TrainFront, label: "Railway", detail: HOTEL_INFO.transit.railway },
  { icon: TramFront, label: "Metro", detail: HOTEL_INFO.transit.metro },
  { icon: Building2, label: "Convention", detail: `${HOTEL_INFO.transit.hitecCity} | ${HOTEL_INFO.transit.hitex}` },
  { icon: MapPinned, label: "Tech Hub", detail: HOTEL_INFO.transit.financialDistrict },
];

/* ─── Floating trust badges ─── */
const TrustBadges = () => (
  <div className="trust-badges">
    {[
      { icon: Star, label: "4.8 Google Rating", sub: "156 verified reviews" },
      { icon: Shield, label: "Secure Payments", sub: "Razorpay protected" },
      { icon: Clock, label: "24/7 Concierge", sub: "Always available" },
      { icon: Award, label: "Premium Certified", sub: "Madhapur's finest" },
    ].map(({ icon: Icon, label, sub }) => (
      <div key={label} className="trust-badge reveal stagger-item">
        <div className="trust-badge__icon">
          <Icon size={14} color="#c9a84c" />
        </div>
        <div>
          <div className="trust-badge__title">{label}</div>
          <div className="trust-badge__sub">{sub}</div>
        </div>
      </div>
    ))}
  </div>
);

/* ─── Bento Grid Section ─── */
const BentoGrid = () => (
  <section className="section">
    <SectionHeading
      eyebrow="The Experience"
      title="Everything you need, beautifully arranged"
      description="From swift connectivity to impeccable service, Bael Tree Hotels is designed for modern travelers."
      centered
    />
    <div className="bento-grid">
      <div className="bento-item bento-tall reveal stagger-item">
        <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80" alt="Luxury Room" />
        <div className="bento-content">
          <h3>85 Luxury Rooms</h3>
          <p>Four distinct categories tailored for comfort and elegance.</p>
        </div>
      </div>
      
      <div className="bento-item bento-wide reveal stagger-item">
        <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80" alt="Restaurant" />
        <div className="bento-content">
          <h3>2 Signature Restaurants</h3>
          <p>Kadali Patra and The Soul Curry</p>
        </div>
      </div>

      <div className="bento-item bento-square reveal stagger-item">
        <div className="bento-solid" style={{ background: "linear-gradient(135deg, #1a1a1a, #2c1a1a)" }}>
          <Star size={40} color="#c9a84c" style={{ marginBottom: "1rem" }} />
          <h3>4.8★</h3>
          <p>Google Rating</p>
        </div>
      </div>

      <div className="bento-item bento-square reveal stagger-item">
        <div className="bento-solid" style={{ background: "linear-gradient(135deg, #7b1a1a, #4a0d0d)" }}>
          <MapPinned size={40} color="#e8d5a3" style={{ marginBottom: "1rem" }} />
          <h3>2km</h3>
          <p>To Hitec City</p>
        </div>
      </div>
    </div>
  </section>
);

/* ─── Sticky Scroll Section (Why Choose Us) ─── */
const StickyWhyChooseUs = () => {
  const reasons = [
    {
      number: "01",
      title: "Heritage Meets Modernity",
      text: "Our interiors blend Hyderabad's rich cultural legacy with contemporary luxury design — warm woods, gold accents, and artisanal textures throughout.",
    },
    {
      number: "02",
      title: "Business-Ready Location",
      text: "Positioned 2 km from Hitec City and 6 km from the Financial District, with seamless access to HITEX, Microsoft, Wipro, and Deloitte campuses.",
    },
    {
      number: "03",
      title: "Seamless Booking & Support",
      text: "Instant Razorpay-secured bookings, 24/7 concierge, private airport transfers, and a dedicated front desk team that anticipates before you ask.",
    }
  ];

  return (
    <section className="sticky-section section">
      <div className="sticky-container">
        {/* Left Sticky Image */}
        <div className="sticky-left reveal">
          <div className="sticky-image-wrapper">
            <img src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80" alt="Bael Tree Experience" />
            <div className="sticky-overlay">
              <span className="eyebrow" style={{ color: "#c9a84c" }}>Why Bael Tree</span>
              <h2>The art of refined hospitality</h2>
              <p>Every element of your stay is shaped by intentional luxury and warm Indian tradition.</p>
            </div>
          </div>
        </div>

        {/* Right Scrolling Content */}
        <div className="sticky-right">
          {reasons.map((item, i) => (
            <article key={i} className="sticky-card reveal stagger-item">
              <span className="sticky-card__number">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Featured Quote / Pull quote ─── */
const PullQuote = () => (
  <section className="pull-quote-section">
    <div className="pull-quote-container reveal">
      <Quote size={40} color="rgba(201,168,76,0.3)" />
      <blockquote>
        "A stay that is not merely comfortable, but truly soulful — where heritage warmth meets the pace of modern Hyderabad."
      </blockquote>
      <div>
        <div className="pull-quote-author">Bael Tree Hotels Philosophy</div>
        <div className="pull-quote-location">Madhapur, Hyderabad</div>
      </div>
    </div>
  </section>
);

const Home = () => {
  const { data: rooms } = useFirestoreCollection("rooms", {
    fallbackData: ROOM_CATEGORIES,
  });
  const availabilityToday = useAllRoomsAvailabilityToday();

  return (
    <>
      <SEOHead
        title="Bael Tree Hotels | Luxury Hotel in Madhapur, Hyderabad | Near Hitec City"
        description="Bael Tree Hotels — Madhapur's premier luxury boutique hotel offering heritage-inspired rooms, signature dining at Kadali Patra & The Soul Curry, and seamless access to Hitec City, HITEX, and the Financial District. Book now."
        path="/"
      />

      {/* ── Hero ── */}
      <HeroSlider />

      <GoogleReviewsSection />

      {/* ── Intro ── */}
      <section className="section section--intro">
        <div className="intro-content reveal">
          <span className="eyebrow">Luxury Heritage Stay · Madhapur, Hyderabad</span>
          <h1>{HOTEL_INFO.tagline}</h1>
          <p>
            In the heart of Madhapur, Bael Tree Hotels blends warm Indian
            hospitality with a polished editorial sensibility. Guests arrive for
            proximity to Hitec City and stay for the calm, tailored atmosphere.
          </p>
          <div className="intro-actions">
            <Link to="/rooms" className="btn btn-gold">
              Explore Rooms
              <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="btn btn-outline">
              Plan Your Stay
            </Link>
          </div>
        </div>

        {/* Trust badges */}
        <TrustBadges />
      </section>

      {/* ── Video Showcase (Instagram Reels Style) ── */}
      <VideoShowcase />

      {/* ── Sticky Why Choose Us ── */}
      <StickyWhyChooseUs />

      {/* ── Rooms ── */}
      <section className="section">
        <SectionHeading
          eyebrow="Stay Collection"
          title="Rooms shaped for focus, rest, and indulgence"
          description="Four distinct room categories bring together warm materials, precise service, and pricing aligned to both business and leisure travel."
          centered
        />
        <div className="cards-grid">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              availabilityToday={availabilityToday[room.category]}
            />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link to="/rooms" className="btn btn-outline" style={{ display: "inline-flex" }}>
            View All Room Details
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Bento Grid Amenities ── */}
      <BentoGrid />

      {/* ── Pull Quote ── */}
      <PullQuote />

      {/* ── Dining ── */}
      <DiningSection />

      {/* ── How to Reach ── */}
      <section className="section">
        <SectionHeading
          eyebrow="How to Reach"
          title="Well-positioned for arrivals across the city"
          description="A convenient address for business districts, convention spaces, transit links, and airport access."
          centered
        />
        <div className="reach-grid">
          {reachItems.map(({ icon: Icon, label, detail }) => (
            <article key={label} className="reach-card reveal stagger-item">
              <Icon size={22} />
              <strong>{label}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Attractions ── */}
      <section className="section">
        <SectionHeading
          eyebrow="Nearby Attractions"
          title="Discover Hyderabad beyond the business district"
          description="Cultural icons, public gardens, and leisure destinations are within easy reach of the hotel."
          centered
        />
        <div className="attractions-grid">
          {ATTRACTIONS.map((attraction) => (
            <article key={attraction.id} className="attraction-card reveal stagger-item">
              <img src={attraction.image} alt={attraction.name} loading="lazy" />
              <div>
                <strong>{attraction.name}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <TestimonialsSection />

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="cta-banner-content reveal">
          <span className="eyebrow" style={{ color: "#c9a84c" }}>Ready to Experience Bael Tree?</span>
          <h2>Reserve your stay in Hyderabad's finest boutique hotel</h2>
          <p>Complimentary Wi-Fi · Signature Dining · 24/7 Concierge · Airport Transfers</p>
          <div className="cta-actions">
            <Link to="/booking" className="btn btn-gold">
              Book Now
              <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="btn btn-outline" style={{ color: "#faf8f5", borderColor: "rgba(201,168,76,0.4)" }}>
              Talk to Concierge
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
